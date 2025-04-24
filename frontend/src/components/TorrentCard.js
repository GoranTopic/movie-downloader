import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { secondsToHms } from '../utils.js';
import CircularProgess from './CirularProgessTimer.js';
import LinearProgressWithLabel from './LinearProgressWithLabel.js';
import DownloadButton from './DownloadButton';
import { useState } from 'react';
import { delete_torrent } from '../transmission-cli';
import RemoveX from './RemoveX';

export default function TorrentCard({ torrent, setTorrents, onPlay }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        
        try {
            const response = await delete_torrent(torrent.id);
            if (response.torrents) {
                setTorrents(response.torrents);
            }
        } catch (error) {
            console.error('Error deleting torrent:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Card sx={{ display: 'flex', marginY: 1, marginX: "5%", position: 'relative' }}>
            {/* Use the RemoveX component */}
            <RemoveX onDelete={handleDelete} disabled={isDeleting} />

            <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
                {torrent.medium_cover_image ?
                    <CardMedia
                        component="img"
                        sx={{ width: '7rem', height: '100%' }}
                        image={torrent.medium_cover_image}
                        alt={torrent.title}
                    /> : null}
                <CardContent sx={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography component="div"> {torrent.name} </Typography>
                            <Typography variant="subtitle1" color="text.secondary" component="div">
                                peers: {torrent.peersSendingToUs} seeds: {torrent.peersGettingFromUs} Rate: {torrent.rateDownload} eta: {secondsToHms(torrent.eta / 1000)}
                            </Typography>
                        </Box>
                        <Box sx={{ width: '100%' }}>
                            <LinearProgressWithLabel value={torrent.percentDone * 100} />
                        </Box>
                        <Typography marginLeft={0.5} variant="subtitle2" color="text.secondary" component="div">
                            down: {torrent.downloadedEver} up: {torrent.uploadedEver} total: {torrent.totalSize}
                        </Typography>
                    </Box>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        alignItems: 'flex-end'
                    }}>
                        <CircularProgess
                            torrent={torrent}
                            size={60}
                            setTorrents={setTorrents}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {torrent.status === 6 && (
                                <DownloadButton 
                                    torrent={torrent}
                                />
                            )}
                            <IconButton
                                onClick={() => onPlay(torrent)}
                                aria-label="play"
                                size="large"
                                disabled={torrent.status !== 6}>
                                <PlayArrowIcon 
                                    sx={{ 
                                        width: '2rem', 
                                        height: '2rem',
                                        color: torrent.status === 6 ? 'primary' : 'disabled'
                                    }}
                                />
                            </IconButton>
                        </Box>
                    </Box>
                </CardContent>
            </Box>
        </Card>
    );
}
