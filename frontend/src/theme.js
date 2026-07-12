import { createTheme } from '@mui/material/styles';
import { grey, yellow, green } from '@mui/material/colors';

// shared component polish for both themes
const sharedComponents = {
    MuiCard: {
        styleOverrides: {
            root: {
                borderRadius: 12,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
                },
            },
        },
    },
    MuiButton: {
        styleOverrides: {
            root: { borderRadius: 8, textTransform: 'none', fontWeight: 600 },
        },
    },
    MuiLinearProgress: {
        styleOverrides: {
            root: { borderRadius: 4, height: 7 },
        },
    },
};

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
        ...sharedComponents,
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
            // brighter green pops better on the dark background
            main: green[600],
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
        ...sharedComponents,
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
