import * as React from 'react';
import './App.css';
import NoSsr from '@mui/material/NoSsr';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { Box, Typography, Chip, IconButton, Tooltip, Button, Snackbar, Alert } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonIcon from '@mui/icons-material/Person';
import { lightTheme, darkTheme } from './theme.js'
import { userColor } from './utils.js';
import { query_status, transmision_add_torrent } from './transmission-cli.js';
import { get_stored_user, check_session, guest_login, logout } from './auth-cli.js';
import { connect_socket, disconnect_socket, subscribe, socket_connected } from './ws-cli.js';
import { getSubs } from './yts-subs-cli.js';
import AuthModal from './components/AuthModal';
import MovieSearchBar from './components/MovieSearchBar.js'
import LinearProgressMemory from './components/LinearProgressMemory.js'
import TransmisionList from './components/TrasnmissionList.js'
import ThemeButton from './components/ThemeChangeButton';
import ErrorModal from './components/ErrorModal';
import MediaPlayerModal from './components/MediaPlayerModal';

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';


function App() {
    // this is the state of the torrents
    const [torrents, setTorrents] = React.useState([]);
    // whether the first status update has arrived (drives the skeletons)
    const [loaded, setLoaded] = React.useState(false);
    // this is the state of the memory
    const [memory, setMemory] = React.useState({});
    // theme state
    const [theme, setTheme] = React.useState('dark');
    // error state
    const [error, setError] = React.useState({
        open: false,
        message: ''
    });
    // playing state
    const [playingTorrent, setPlayingTorrent] = React.useState(null);
    // logged-in user state
    const [user, setUser] = React.useState(get_stored_user());
    // whether the sign in / sign up dialog is open
    const [authOpen, setAuthOpen] = React.useState(false);
    // "X is now watching with you" notification
    const [joinNotice, setJoinNotice] = React.useState(null);

    React.useEffect(() => {
        // validate the stored session; if there is none (or it expired),
        // automatically become a guest with a random name
        check_session()
            .then(async validUser => setUser(validUser || await guest_login()))
            .catch(err => console.error('Could not establish a user session:', err));
    }, []);

    React.useEffect(() => {
        /* as soon as the compnent loads,
         * lets query transimission-remote for the list of torrents */
        update_app();
        // live updates arrive over the websocket
        const unsubscribe = subscribe(msg => {
            if (msg.type === 'status') {
                if (msg.torrents) setTorrents([...msg.torrents]);
                if (msg.memory) setMemory({ ...msg.memory });
                setLoaded(true);
            } else if (msg.type === 'watcher-joined') {
                setJoinNotice(msg);
            } else if (msg.type === 'connected') {
                setError({ open: false, message: '' });
            }
        });
        // fallback: poll the old way only while the socket is down
        const interval = setInterval(async () => {
            if (!socket_connected()) update_app();
        }, 5000);
        return () => {
            unsubscribe();
            clearInterval(interval);
            disconnect_socket();
        };
    }, []);

    // (re)connect the live socket whenever the identity changes,
    // so join notifications reach the right user
    React.useEffect(() => {
        if (user) connect_socket();
    }, [user]);

    // update the list of torrents
    const update_app = async () => {
        try {
            let { torrents, memory } = await query_status();
            // update the state with the new list of torrents
            if (torrents) setTorrents([...torrents]);
            if (memory) setMemory({...memory});
            setLoaded(true);
            // Clear any existing errors if the request succeeds
            setError({ open: false, message: '' });
        } catch (err) {
            console.error('Network error:', err);
            let errorMessage = 'Unable to connect to the server. Please check your connection and try again.';
            
            if (err.message && err.message.includes('Cannot connect to Transmission')) {
                errorMessage = err.message;
            }
            
            setError({
                open: true,
                message: errorMessage
            });
        }
    }

    // log the user out and fall back to a fresh guest identity
    const handleLogout = async () => {
        logout();
        setUser(null);
        try {
            setUser(await guest_login());
        } catch (err) {
            console.error('Could not create a guest session:', err);
        }
    };

    // this function is called when the user selects a suggestion
    const selectSuggestion = async (suggestion, quality) => {
        if (!user) return; // must be logged in to download
        try {
            let id = await transmision_add_torrent(suggestion, quality, suggestion.imdb_code);
            if (id) // add loading torrent to the list
                setTorrents(torrents => [...torrents,
                { id: id, name: suggestion.title, status: "loading", owner: user.username }
                ]);
            // Clear any existing errors if the request succeeds
            setError({ open: false, message: '' });
            // query the subtitles
            let updatedTorrent = await getSubs(id, suggestion.imdb_code);
            // update the torrents with the subtitles
            setTorrents(torrents => torrents.map(torrent => 
                torrent.id === id ? updatedTorrent : torrent
            ));
        } catch (err) {
            console.error('Network error:', err);
            setError({
                open: true,
                // show the server's reason (e.g. movie limit reached) when there is one
                message: err.message || 'Unable to add torrent. Please check your connection and try again.'
            });
        }
    }

    // handle play button click; startAt joins another user's position
    const handlePlay = (torrent, startAt = null) => {
        setPlayingTorrent({ torrent, startAt });
    };

    // handle close media player
    const handleClosePlayer = () => {
        setPlayingTorrent(null);
    };

    // change the theme
    const toggleTheme = () =>
        setTheme(theme => theme === 'dark' ? 'light' : 'dark');

    // handle error modal close
    const handleErrorClose = () => {
        setError({ open: false, message: '' });
    };

    return (
        <NoSsr>
            <MuiThemeProvider theme={theme === 'dark' ? darkTheme : lightTheme}>
                <Box
                    paddingX={{ xs: '2%', md: '5%' }}
                    marginBottom={'5%'}
                    backgroundColor='background.default'
                    height='100%'
                    position='relative'
                    sx={{
                        '&::before': {
                            content: '""',
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'background.default',
                            zIndex: -1,
                        }
                    }}
                >
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 0.5,
                        width: '100%',
                        mb: 2,
                        pt: { xs: 2, md: 3 }
                    }}>
                        <Typography
                            variant="h4"
                            component="h1"
                            sx={{
                                flexGrow: 1,
                                fontWeight: 'bold',
                                color: 'text.primary',
                                // shrink the title so everything fits on a phone
                                fontSize: { xs: '1.35rem', sm: '1.8rem', md: '2.125rem' },
                                whiteSpace: 'nowrap',
                            }}
                        >
                            Goran's Movie Downloader
                        </Typography>
                        {user && (
                            <>
                                <Chip
                                    size="small"
                                    icon={<PersonIcon sx={{ color: 'white !important' }} />}
                                    label={user.username}
                                    sx={{
                                        mr: 1,
                                        backgroundColor: userColor(user.username),
                                        color: 'white',
                                        fontWeight: 'bold',
                                        maxWidth: { xs: '9rem', md: 'none' },
                                    }}
                                />
                                {user.guest ? (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<LoginIcon />}
                                        onClick={() => setAuthOpen(true)}
                                        sx={{ mr: 1, whiteSpace: 'nowrap' }}
                                    >
                                        Sign In
                                    </Button>
                                ) : (
                                    <Tooltip title="Logout">
                                        <IconButton onClick={handleLogout} aria-label="logout">
                                            <LogoutIcon />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </>
                        )}
                        <ThemeButton toggleTheme={toggleTheme} />
                    </Box>
                    <LinearProgressMemory
                        used={memory.used}
                        claimed={memory.claimed}
                        total={memory.total}
                        torrents={torrents}
                        user={user}
                    />
                    <MovieSearchBar selectSuggestion={selectSuggestion} />
                    <TransmisionList
                        torrents={torrents}
                        setTorrents={setTorrents}
                        onPlay={handlePlay}
                        user={user}
                        loaded={loaded}
                    />
                    <AuthModal
                        open={authOpen}
                        onClose={() => setAuthOpen(false)}
                        onAuthenticated={(u) => { setUser(u); setAuthOpen(false); }}
                    />
                    <ErrorModal
                        open={error.open}
                        onClose={handleErrorClose}
                        errorMessage={error.message}
                    />
                    {playingTorrent && (
                        <MediaPlayerModal
                            open={true}
                            onClose={handleClosePlayer}
                            torrent={playingTorrent.torrent}
                            startAt={playingTorrent.startAt}
                        />
                    )}
                    <Snackbar
                        open={!!joinNotice}
                        autoHideDuration={6000}
                        onClose={() => setJoinNotice(null)}
                        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    >
                        <Alert
                            onClose={() => setJoinNotice(null)}
                            icon={<PersonIcon fontSize="inherit" />}
                            variant="filled"
                            sx={{
                                backgroundColor: joinNotice ? userColor(joinNotice.username) : undefined,
                                color: 'white',
                                '& .MuiAlert-icon': { color: 'white' },
                            }}
                        >
                            {joinNotice?.username} is now watching "{joinNotice?.movie}" with you
                        </Alert>
                    </Snackbar>
                </Box>
            </MuiThemeProvider>
        </NoSsr>
    );
}

export default App;
