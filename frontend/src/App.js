import * as React from 'react';
import './App.css';
import NoSsr from '@mui/material/NoSsr';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import { lightTheme, darkTheme } from './theme.js'
import { query_status, transmision_add_torrent } from './transmission-cli.js';
import { getSubs } from './yts-subs-cli.js';
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

    React.useEffect(() => {
        /* as soon as the compnent loads,
         * lets query transimission-remote for the list of torrents */
        update_app();
        // return empty list of now 
        const interval = setInterval(async () => update_app(), 1000);
        return () => clearInterval(interval);
    }, []);

    // update the list of torrents
    const update_app = async () => {
        try {
            let { torrents, memory } = await query_status();
            // update the state with the new list of torrents
            if (torrents) setTorrents([...torrents]);
            if (memory) setMemory({...memory});
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

    // this function is called when the user selects a suggestion
    const selectSuggestion = async (suggestion, quality) => {
        try {
            let id = await transmision_add_torrent(suggestion, quality, suggestion.imdb_code);
            if (id) // add loading torrent to the list
                setTorrents(torrents => [...torrents,
                { id: id, name: suggestion.title, status: "loading" }
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
                message: 'Unable to add torrent. Please check your connection and try again.'
            });
        }
    }

    // handle play button click
    const handlePlay = (torrent) => {
        setPlayingTorrent(torrent);
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
                    paddingX={'5%'}
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
                        width: '100%', 
                        mb: 2,
                        pt: 3  // Adding top padding
                    }}>
                        <Typography 
                            variant="h4" 
                            component="h1" 
                            sx={{ 
                                flexGrow: 1,
                                fontWeight: 'bold',
                                color: 'text.primary'
                            }}
                        >
                            Terac's Movie Downloader
                        </Typography>
                        <ThemeButton toggleTheme={toggleTheme} />
                    </Box>
                    <LinearProgressMemory
                        used={memory.used}
                        claimed={memory.claimed}
                        total={memory.total} 
                    />
                    <MovieSearchBar selectSuggestion={selectSuggestion} />
                    <TransmisionList 
                        torrents={torrents} 
                        setTorrents={setTorrents}
                        onPlay={handlePlay}
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
                            torrent={playingTorrent}
                        />
                    )}
                </Box>
            </MuiThemeProvider>
        </NoSsr>
    );
}

export default App;
