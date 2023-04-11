import { createTheme } from '@mui/material/styles';
import { cyan, grey, yellow, green } from '@mui/material/colors';

const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: green[800],
        },
        secondary: {
            main: grey[400],
        },
        yellow: {
            main: yellow[600],
            light: '#ffa726',
            dark: '#ef6c00',
            contrastText: 'rgba(0, 0, 0, 0.87)',
        },
        white: {
            main: grey[500],
        },
    },
});

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: green[800], // white
        },
        secondary: {
            main: grey[200], // more grey
        },
    },
});

export { lightTheme, darkTheme }