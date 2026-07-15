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
import { secondsToHms, userColor, bytesToHumanReadable } from '../utils.js';
import LinearProgressWithLabel from './LinearProgressWithLabel.js';
import DownloadButton from './DownloadButton';
import { useState } from 'react';
import { delete_torrent } from '../transmission-cli';
import RemoveX from './RemoveX';

export default function TorrentCard({ torrent, setTorrents, onPlay, user }) {
    const [isDeleting, setIsDeleting] = useState(false);
    // only the user who added the movie may delete it
    const canDelete = !torrent.owner || torrent.owner === user?.username;
    // where this user stopped watching last time (ignore the first seconds)
    const resumeTime = torrent.progress?.[user?.username] || 0;
    const canResume = resumeTime > 30;

    const handleDelete = async () => {
        setIsDeleting(true);
        // optimistic: drop the card right away; if the server refuses,
        // the next live status update brings it back
        setTorrents(torrents => torrents.filter(t => t.id !== torrent.id));
        try {
            await delete_torrent(torrent.id);
        } catch (error) {
            console.error('Error deleting torrent:', error);
        }
    };

    return (
        // move it to the most left
        <Card sx={{ display: 'flex', flexDirection: 'column', marginY: 1, marginX: { xs: 0.5, md: '5%' }, position: 'relative' }}>
            {/* Use the RemoveX component,  move RemoveX to the most left */}
            {canDelete && <RemoveX onDelete={handleDelete} disabled={isDeleting} />}

            <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
                {torrent.medium_cover_image ?
                    <CardMedia
                        component="img"
                        loading="lazy"
                        sx={{ width: { xs: '5rem', md: '7rem' }, height: '100%', objectFit: 'cover', flexShrink: 0 }}
                        image={torrent.medium_cover_image}
                        alt={torrent.title}
                    /> : null}
                <CardContent sx={{
                    display: 'flex',
                    // on phones the actions move below the info instead of beside it
                    flexDirection: { xs: 'column', md: 'row' },
                    width: '100%',
                    minWidth: 0,
                    alignItems: { xs: 'stretch', md: 'center' },
                    gap: { xs: 1, md: 0 },
                    padding: { xs: 1.5, md: 2 },
                }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0, gap: 0.5 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', minWidth: 0 }}>
                                <Typography component="div" sx={{
                                    fontSize: { xs: '0.9rem', md: '1rem' },
                                    wordBreak: 'break-word',
                                }}> {torrent.name} </Typography>
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
                            <Typography variant="subtitle2" color="text.secondary" component="div">
                                {torrent.status === 6 ? (
                                    <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
                                        Ready to watch
                                    </Box>
                                ) : (
                                    <>
                                        ↓ {bytesToHumanReadable(torrent.rateDownload || 0)}/s
                                        {' · '}{torrent.peersSendingToUs || 0} peers
                                        {torrent.eta > 0 && ` · ${secondsToHms(torrent.eta)} left`}
                                    </>
                                )}
                            </Typography>
                        </Box>
                        <Box sx={{ width: '100%' }}>
                            <LinearProgressWithLabel value={torrent.percentDone * 100} />
                        </Box>
                        <Typography marginLeft={0.5} variant="caption" color="text.secondary" component="div">
                            {bytesToHumanReadable(torrent.downloadedEver || 0)} downloaded
                            {' · '}{bytesToHumanReadable(torrent.uploadedEver || 0)} uploaded
                            {' · '}{bytesToHumanReadable(torrent.totalSize || 0)} total
                        </Typography>
                    </Box>
                    <Box sx={{
                        display: 'flex',
                        // phone: one horizontal row under the info; desktop: right-side column
                        flexDirection: { xs: 'row', md: 'column' },
                        gap: 1,
                        alignItems: 'center',
                        justifyContent: { xs: 'space-between', md: 'center' },
                        width: { xs: '100%', md: 'auto' },
                        flexShrink: 0,
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
                            <Tooltip
                                arrow
                                title={canResume ? `Resume from ${secondsToHms(Math.floor(resumeTime))}` : ''}
                            >
                                <span>
                                    <IconButton
                                        onClick={() => onPlay(torrent, canResume ? resumeTime : null)}
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
                                </span>
                            </Tooltip>
                        </Box>
                    </Box>
                </CardContent>
            </Box>
        </Card>
    );
}
