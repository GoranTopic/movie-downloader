import React, { useState, useEffect, useRef } from 'react';
import { Box, Modal, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from 'axios';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '95vw',
    height: '95vh',
    bgcolor: 'black',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    overflow: 'hidden',
    outline: 'none'
};

const closeButtonStyle = {
    position: 'absolute',
    top: 16,
    left: 16,
    color: 'white',
    '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    zIndex: 1
};

const errorStyle = {
    color: 'white',
    textAlign: 'center',
    padding: '20px',
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    borderRadius: '8px',
    margin: '20px',
};

const playerContainerStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

export default function MediaPlayerModal({ open, onClose, torrent }) {
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [mediaFilePath, setMediaFilePath] = useState(null);
    const [subtitleTracks, setSubtitleTracks] = useState([]);
    const videoRef = useRef(null);
    const playerRef = useRef(null);
    // Get the server URL from environment variable or use default
    const serverUrl = process.env.REACT_APP_TRANSMISSION_SERVER || 'http://localhost:3001';

    const fetchMedia = async () => {
        if (!torrent) return;

        try {
            console.log('Fetching media path for torrent:', torrent.id);
            const response = await axios.get(`${serverUrl}/stream/${torrent.id}`);
            console.log('Received media file path:', response.data.mediaFilePath);
            setMediaFilePath(`${serverUrl}/media/${response.data.mediaFilePath}`);
            setError(null);
            if (torrent.subtitleTracks) {
                setSubtitleTracks(torrent.subtitleTracks.map(sub => ({
                    kind: 'subtitles',
                    src: `${serverUrl}/media/${sub.subtitlePath}`,
                    srclang: sub.language,
                    label: sub.language,
                })));
                console.log('subtitleTracks:', subtitleTracks);
            }
        } catch (err) {
            console.error('Error fetching media path:', err);
            setError('Error loading video file');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (open && torrent) {
            fetchMedia();
        }
    }, [open, torrent]);

    // Initialize the video.js player
    useEffect(() => {
        if (!mediaFilePath || !videoRef.current) return;
        console.log('Initializing video.js player');
        // Initialize Video.js player
        const videoJsOptions = {
            autoplay: true,
            controls: true,
            responsive: true,
            fluid: true,
            sources: [{
                src: mediaFilePath,
                type: 'video/mp4' // Assuming mp4 format, adjust if necessary
            }],
            tracks: subtitleTracks
        };

        // Create and store the player instance
        const player = videojs(videoRef.current, videoJsOptions, () => {
            console.log('Video.js player is ready');
            setIsLoading(false);
            setError(null);
            playerRef.current = player;

            // Add error handling
            player.on('error', () => {
                console.error('Video.js player error:', player.error());
                setError('Error playing video. Please check if the file exists and try again.');
                setIsLoading(false);
            });
        });

        // Cleanup function
        return () => {
            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, [mediaFilePath, subtitleTracks]);

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="media-player-modal"
            closeAfterTransition
        >
            <Box sx={modalStyle}>
                <IconButton
                    onClick={onClose}
                    sx={closeButtonStyle}
                >
                    <ArrowBackIcon />
                </IconButton>
                
                {error && (
                    <Typography sx={errorStyle}>
                        {error}
                    </Typography>
                )}
                
                {!error && mediaFilePath && (
                    <Box sx={playerContainerStyle}>
                        <div data-vjs-player>
                            <video 
                                ref={videoRef} 
                                className="video-js vjs-big-play-centered"
                                controls
                                preload="auto"
                            />
                        </div>
                    </Box>
                )}
            </Box>
        </Modal>
    );
}



