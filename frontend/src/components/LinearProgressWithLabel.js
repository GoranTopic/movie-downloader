import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function LinearProgressWithLabel(props) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ minWidth: 35, marginRight: 1, marginLeft: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                    {`${Math.round(props.value,)}%`}
                </Typography>
            </Box>
            <Box sx={{ width: '100%', mr: 3 }}>
                <LinearProgress variant="determinate" {...props} />
            </Box>
        </Box>
    );
}