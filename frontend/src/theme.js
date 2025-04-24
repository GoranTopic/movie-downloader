import { createTheme } from '@mui/material/styles';
import { grey, yellow, green } from '@mui/material/colors';

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
        background: {
            default: '#f5f5f5',
            paper: '#ffffff',
        },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: '#f5f5f5',
                    transition: 'background-color 0.3s ease',
                },
            },
        },
    },
});

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: green[800],
        },
        secondary: {
            main: grey[200],
        },
        background: {
            default: '#121212',
            paper: '#1e1e1e',
        },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: '#121212',
                    transition: 'background-color 0.3s ease',
                },
            },
        },
    },
});

export { lightTheme, darkTheme }
