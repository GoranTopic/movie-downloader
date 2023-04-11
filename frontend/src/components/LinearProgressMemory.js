import * as React from 'react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { getPercentageOf, bytesToHumanReadable } from '../utils';
import Typography from '@mui/material/Typography';
export default function LinearProgressMemory({ used, claimed, total }) {
    // print all props

    const [progress, setProgress] = React.useState(getPercentageOf(used, total));
    const [buffer, setBuffer] = React.useState(getPercentageOf(claimed, total));

    React.useEffect(() => {
        setProgress(getPercentageOf(used, total));
        setBuffer(getPercentageOf(claimed, total));
    }, [used, claimed, total]);

    return (
        <Box sx={{ marginX: "5%" }}>
            <Box sx={{
                marginX: "2%", display: 'flex', flexDirection: 'column',
                justifyContent: 'end',
                //backgroundColor: 'pink',
                alignItems: 'end',
            }}>
                <Typography variant="subtitle1" color="text.secondary" component="div">
                    {bytesToHumanReadable(used)} used and {bytesToHumanReadable(claimed)} claimed out of {bytesToHumanReadable(total)}
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'end', alignItems: 'end', }}>
                <Box sx={{ width: 600 }}>
                    <LinearProgress height={100} width={100} variant="buffer" value={progress} valueBuffer={buffer} />
                </Box>
            </Box>
        </Box >
    );
}
