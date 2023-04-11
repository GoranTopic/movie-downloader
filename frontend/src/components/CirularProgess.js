import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { getPercentageOf, secondsToHms } from '../utils.js';

export default function CircularProgess({ value, total, size }) {
    size = size || 60;
    total = total || 100;

    return (
        <Box // this box is circular remove timer
            sx={{
                display: 'flex',
                flexDirection: 'column',
                width: size,
                height: size,
            }} >
            <CircularProgress // this is the circular timer to deletetion
                size={size}
                variant="determinate"
                color="error"
                value={getPercentageOf(value, total)}
            />
            <Box sx={{
                // this is the text which is move uppwars relaviely to the parent
                position: 'absolute',
                width:  size,
                height: size,
                // add css so that the text is in the center
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }} >
                <Typography variant="caption" component="div" color="text.secondary">
                    {`${secondsToHms(total - value)}`}
                </Typography>
            </Box>
        </Box>
    );
}