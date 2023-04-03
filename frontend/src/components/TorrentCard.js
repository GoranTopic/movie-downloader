import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
//import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

export default function TorrentCard({ torrent }) {

    // get the number of minutes from the env file
    const minutesToDeletetion = process.env.MINUTES_TO_DELETION || 20;
    console.log('minutesToDeletetion', minutesToDeletetion)
    // take number of minutes and transform it to seconds
    const minutesToSeconds = minutes => minutes * 60;
    // get the number of seconds from the number of minutes
    const secondToDeletetion = minutesToSeconds(minutesToDeletetion);

    // take the unitial time when the torrent was added and the time now
    // return the percentage of time that has passed
    const getPercentageOfTimePassed = (timeAdded, timeNow, secondToDeletetion) => {
        if(timeNow >= timeAdded + secondToDeletetion) return 100
        let timePassed = timeNow - timeAdded;
        let percentage = timePassed / secondToDeletetion * 100;
        return percentage;
    }

    const [secondsPassed, setSecondsPassed] = React.useState(Math.floor(Date.now() / 1000));
    React.useEffect(() => {
        // set interval to update the percentage of time passed
        const interval = setInterval(() => {
            setSecondsPassed(secondsPassed => secondsPassed + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleDownload = event => {
        //setIsDone(event.target.value);
    };
    console.log('torrent from Card', torrent)

    function LinearProgressWithLabel(props) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ minWidth: 35 }}>
                    <Typography variant="body2" color="text.secondary">{`${Math.round(
                        props.value,
                    )}%`}</Typography>
                </Box>
                <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress variant="determinate" {...props} />
                </Box>
            </Box>
        );
    }

    // this function tranfroms from unix time to human readable time
    const unixTimeToHumanReadable = unixTime => {
        let date = new Date(unixTime * 1000);
        let hours = date.getHours();
        let minutes = "0" + date.getMinutes();
        let seconds = "0" + date.getSeconds();
        let formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
        return formattedTime;
    }

    return (
        <Card sx={{ display: 'flex', padding: 1, marginY: 0.2, marginX: "6%" }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
                {/*
                <CardMedia // this is the movie poster
                    component="img"
                    sx={{ width: 51 }}
                    image={suggestion.small_cover_image}
                    alt={suggestion.title}
                />
                */}
                <CardContent sx={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
                    <Box // this is the torrent info and progress bar
                        sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Box // torrent info
                            sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography component="div" > {torrent.name} </Typography>
                            <Typography marginLeft={0.5} variant="subtitle1" color="text.secondary" component="div">
                                peers: {torrent.peersSendingToUs} seeds: {torrent.peersGettingFromUs} Rate: {torrent.rateDownload} eta: {unixTimeToHumanReadable(torrent.eta)}
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
                    <Box // this box is circular remove timer
                        sx={{ display: 'flex', flexDirection: 'column' }} >
                        <CircularProgress
                            marginLeft={0.5}
                            size={50}
                            variant="determinate"
                            color="secondary"
                            value={getPercentageOfTimePassed(torrent.addedDate, secondsPassed, secondToDeletetion)}
                        />
                        <Box sx={{
                            // move uppwars relaviely to the parent
                            position: 'absolute',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }} >
                            <Typography variant="caption" component="div" color="text.secondary">
                                {`${unixTimeToHumanReadable(secondToDeletetion + torrent.addedDate - secondsPassed)}`}
                            </Typography>
                        </Box>
                        <IconButton
                            disabled={torrent.percentDone !== 1}
                            onClick={handleDownload} aria-label="download" size="large">
                            <FileDownloadIcon
                                color='primery' />
                        </IconButton>
                    </Box>
                </CardContent>
            </Box>
        </Card >
    );
}