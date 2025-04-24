import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { getPercentageOf, secondsToHms } from '../utils.js';
import * as React from 'react';
import { add_time } from '../transmission-cli.js';

export default function CircularProgess({ size, torrent, setTorrents }) {
    const remainingMs = torrent.msLifeSpan - torrent.msAge;
    const [secondsRemaining, setSecondsRemaining] = React.useState(Math.round(remainingMs / 1000));
    const [loading, setLoading] = React.useState(false);
    size = size || 60;

    // Update seconds remaining every second
    React.useEffect(() => {
        const interval = setInterval(() => {
            setSecondsRemaining(prev => {
                if (prev <= 0) return 0;
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleTimeExtension = async () => {
        setLoading(true);
        try {
            const response = await add_time(torrent.id);
            if (response.status === 'ok') {
                setSecondsRemaining(Math.round(response.torrent.remainingTimeToDeletion / 1000));
                setTorrents(torrents => torrents.map(t => 
                    t.id === torrent.id ? response.torrent : t
                ));
            } else {
                console.error('Error extending time:', response.error);
                // You might want to show a toast notification here
            }
        } catch (error) {
            console.error('Error extending time:', error);
            // You might want to show a toast notification here
        } finally {
            setLoading(false);
        }
    };

    return (
        <IconButton
            onClick={handleTimeExtension}
            disabled={loading}
            sx={{
                width: size,
                height: size,
                position: 'relative',
                padding: 0
            }}
        >
            <Box sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {loading ? (
                    <CircularProgress
                        size={size}
                        color="error"
                        variant="indeterminate"
                    />
                ) : (
                    <>
                        <CircularProgress
                            size={size}
                            variant="determinate"
                            color="error"
                            value={getPercentageOf(torrent.msAge, torrent.msLifeSpan)}
                            total={100}
                        />
                        <Box sx={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Typography variant="caption" component="div" color="text.secondary">
                                {`${secondsToHms(secondsRemaining)}`}
                            </Typography>
                        </Box>
                    </>
                )}
            </Box>
        </IconButton>
    );
}