import { createTheme } from '@mui/material/styles';
import {  cyan, grey, yellow, } from '@mui/material/colors';

const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: cyan[100],
        },
        secondary: {
            main: grey[50],
        },
        yellow: {
            main: yellow[600],
            light: '#ffa726',
            dark: '#ef6c00',
            contrastText: 'rgba(0, 0, 0, 0.87)',
        },
        white: {
            main: grey[50],
        },
    },
});

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: grey[50], // white
        },
        secondary: {
            main: grey[200], // more grey
        },
    },
});

export { lightTheme, darkTheme }