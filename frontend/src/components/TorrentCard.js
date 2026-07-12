import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PersonIcon from '@mui/icons-material/Person';
import AutoDeleteIcon from '@mui/icons-material/AutoDelete';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { secondsToHms, userColor } from '../utils.js';
import LinearProgressWithLabel from './LinearProgressWithLabel.js';
import DownloadButton from './DownloadButton';
import { useState } from 'react';
import { delete_torrent } from '../transmission-cli';
import RemoveX from './RemoveX';

export default function TorrentCard({ torrent, setTorrents, onPlay, user }) {
    const [isDeleting, setIsDeleting] = useState(false);
    // only the user who added the movie may delete it
    const canDelete = !torrent.owner || torrent.owner === user?.username;

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
        // move it to the most left
        <Card sx={{ display: 'flex', flexDirection: 'column', marginY: 1, marginX: "5%", position: 'relative' }}>
            {/* Use the RemoveX component,  move RemoveX to the most left */}
            {canDelete && <RemoveX onDelete={handleDelete} disabled={isDeleting} />}

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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography component="div"> {torrent.name} </Typography>
                                {torrent.owner && (
                                    <Chip
                                        icon={<PersonIcon sx={{ color: 'white !important' }} />}
                                        label={torrent.owner}
                                        size="small"
                                        sx={{
                                            backgroundColor: userColor(torrent.owner),
                                            color: 'white',
                                            fontWeight: 'bold',
                                        }}
                                    />
                                )}
                            </Box>
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
                        {torrent.remainingTimeToDeletion !== undefined && (
                            <Tooltip
                                arrow
                                title={`This movie will be deleted at ${new Date(Date.now() + torrent.remainingTimeToDeletion).toLocaleString()}`}
                            >
                                <Typography
                                    variant="caption"
                                    component="div"
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        whiteSpace: 'nowrap',
                                        // turn red when less than an hour is left
                                        color: torrent.remainingTimeToDeletion < 60 * 60 * 1000
                                            ? 'error.main' : 'text.secondary',
                                    }}
                                >
                                    <AutoDeleteIcon fontSize="inherit" />
                                    deletes in {secondsToHms(torrent.remainingTimeToDeletion / 1000)}
                                </Typography>
                            </Tooltip>
                        )}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {/* watch together: one colored play button per user
                                currently watching this movie */}
                            {(torrent.watchers || [])
                                .filter(w => w.username !== user?.username)
                                .map(w => {
                                    // catch up for the time since their last report
                                    const joinTime = w.time + (w.paused ? 0 : w.ago);
                                    return (
                                        <Tooltip
                                            key={w.username}
                                            arrow
                                            title={`Watch together with ${w.username}${w.paused ? ' (paused)' : ''} — at ${secondsToHms(Math.floor(joinTime)) || '0s'}`}
                                        >
                                            <span>
                                                <IconButton
                                                    onClick={() => onPlay(torrent, joinTime)}
                                                    aria-label={`watch together with ${w.username}`}
                                                    size="large"
                                                    disabled={torrent.status !== 6}
                                                >
                                                    <PlayArrowIcon
                                                        sx={{
                                                            width: '2rem',
                                                            height: '2rem',
                                                            color: userColor(w.username),
                                                        }}
                                                    />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    );
                                })}
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
