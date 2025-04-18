import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { secondsToHms } from '../utils.js';
import CircularProgess from './CirularProgess.js';
import LinearProgressWithLabel from './LinearProgressWithLabel.js';


export default function TorrentCard({ torrent }) {
    // millisendons to deletetion
    const msToDeletion = torrent.msToDeletion;
    // round seconds to deletetion
    const secondsToDeletion = Math.round(msToDeletion / 1000);
    // remaining time to deletetion
    const remainingMs=  torrent.remainingTimeToDeletion 
    // convert from milliseconds to seconds
    const [remainingSeconds, setRemainingSeconds] = React.useState( remainingMs / 1000);
    // the percentage of time passed
    React.useEffect(() => {
        // set interval to update the percentage of time passed
        const interval = setInterval(() => {
            setRemainingSeconds(remainingSeconds => remainingSeconds - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);


    const handleDownload = event => {
        // open abosulte url to download the torrent file
        console.log('torrent.url:', torrent.url)
        window.open(torrent.url, '_blank'); // open in new tab  
    };

    return (
        <Card sx={{ display: 'flex', marginY: 1, marginX: "5%" }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
                { torrent.medium_cover_image? 
                <CardMedia // this is the movie poster
                    component="img"
                    sx={{ width: '7rem', height: '100%' }}
                    image={torrent.medium_cover_image}
                    alt={torrent.title}
                /> : null }
                <CardContent sx={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
                    <Box // this is the torrent info and progress bar
                        sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Box // torrent info
                            sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography component="div" > {torrent.name} </Typography>
                            <Typography variant="subtitle1" color="text.secondary" component="div">
                                peers: {torrent.peersSendingToUs} seeds: {torrent.peersGettingFromUs} Rate: {torrent.rateDownload} eta: {secondsToHms(torrent.eta / 1000)}
                            </Typography>
                        </Box>
                        <Box // progress bar
                            sx={{ width: '100%' }}>
                            <LinearProgressWithLabel value={torrent.percentDone * 100} />
                        </Box>
                        <Typography marginLeft={0.5} variant="subtitle2" color="text.secondary" component="div">
                            down: {torrent.downloadedEver} up: {torrent.uploadedEver} total: {torrent.totalSize}
                        </Typography>
                    </Box>
                    <Box // this is the timer and download button
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                        }} >
                        <CircularProgess
                            value={secondsToDeletion - remainingSeconds} total={secondsToDeletion} size={60} />
                        <IconButton
                            disabled={torrent.percentDone !== 1}
                            onClick={handleDownload} aria-label="download" size="large">
                            <FileDownloadIcon sx={{ width: '3rem', height: '3rem', }}
                                color='primery' />
                        </IconButton>
                    </Box>
                </CardContent>
            </Box>
        </Card >
    );
}
