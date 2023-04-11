// make a react compnent button that changes the theme from dark to light
// it also changes the icon from a moon to a sun
import * as React from 'react';
import { IconButton, } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { Box } from '@mui/system';

export default function ThemeButton({toggleTheme}) {
    // the current theme being used
    const theme = useTheme().palette.mode;

    return (
        <Box sx={{ marginX: '5%', display: 'flex', flexDirection: 'column', justifyContent: 'end', alignItems: 'end', }}>
            <IconButton onClick={toggleTheme}>
                {theme === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
            </IconButton>
        </Box>
    );
}