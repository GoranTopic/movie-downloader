import * as React from 'react';
import './App.css';
import NoSsr from '@mui/material/NoSsr';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { Box } from '@mui/system';
import { lightTheme, darkTheme } from './theme.js'
import { query_status, transmision_add_torrent } from './transmission-cli.js';
import MovieSearchBar from './components/MovieSearchBar.js'
import LinearProgressMemory from './components/LinearProgressMemory.js'
import TransmisionList from './components/TrasnmissionList.js'
import ThemeButton from './components/ThemeChangeButton';

function App() {

    // this is the state of the torrents
    const [torrents, setTorrents] = React.useState([]);
    // this is the state of the memory
    const [memory, setMemory] = React.useState({});
    // theme state
    const [theme, setTheme] = React.useState('dark');

    React.useEffect(() => {
        /* as soon as the compnent loads,
         * lets query transimission-remote for the list of torrents */
        update_app();
        // return empty list of now 
        setInterval(async () => update_app(), 20000);
    }, []);

    // update the list of torrents
    const update_app = async () => {
        let { torrents, memory } = await query_status();
        // update the state with the new list of torrents
        if (torrents) setTorrents([...torrents]);
        if (memory) setMemory({...memory});
    }

    // this function is called when the user selects a suggestion
    const selectSuggestion = async (suggestion, quality) => {
        let id = await transmision_add_torrent(suggestion, quality);
        if (id) // add loading torrent to the list
            setTorrents(torrents => [...torrents,
            { id: id, name: suggestion.title, status: "loading" }
            ]);
    }

    // change the theme
    const toggleTheme = () =>
        setTheme(theme => theme === 'dark' ? 'light' : 'dark');


    return (
        <NoSsr>
            <MuiThemeProvider theme={theme === 'dark' ? darkTheme : lightTheme}>
                <Box paddingX={'5%'}
                    backgroundColor='background.default'
                    height='100vh'
                    justifyContent='center'
                    alignItems='center' >
                    <ThemeButton toggleTheme={toggleTheme} />
                    <LinearProgressMemory
                        used={memory.used}
                        claimed={memory.claimed}
                        total={memory.total} />
                    <MovieSearchBar selectSuggestion={selectSuggestion} />
                    <TransmisionList torrents={torrents} />
                </Box>
            </MuiThemeProvider>
        </NoSsr>
    );
}

export default App;
