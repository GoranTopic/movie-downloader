import * as React from 'react';
import './App.css';
import NoSsr from '@mui/material/NoSsr';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { Box } from '@mui/system';
import { lightTheme } from './theme.js'
import MovieSearchBar from './components/MovieSearchBar.js'
import TransmisionList from './components/TrasnmissionList.js'

function App() {
    return (
        <NoSsr>
            <MuiThemeProvider theme={lightTheme}>
                <Box margin={'5%'} justifyContent='center' alignItems='center' >
                    <MovieSearchBar />
                    <TransmisionList />
                </Box>
            </MuiThemeProvider>
        </NoSsr >
    );
}

export default App;
