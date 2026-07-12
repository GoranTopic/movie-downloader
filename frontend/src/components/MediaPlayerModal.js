import React, { useState, useEffect, useRef } from 'react';
import { Box, Modal, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from 'axios';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { report_watching, stop_watching } from '../transmission-cli';
import { subscribe, send_message } from '../ws-cli';

// how often the player reports the playback position
const WATCH_HEARTBEAT_MS = 5000;
// ignore drift below this many seconds when syncing the group
const SYNC_DRIFT_S = 1.5;

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

// encode each segment of a relative path so names with
// spaces/brackets survive as a URL
const encodePath = (relPath) =>
    relPath.split('/').map(encodeURIComponent).join('/');

export default function MediaPlayerModal({ open, onClose, torrent, startAt }) {
    const [error, setError] = useState(null);
    const [mediaFilePath, setMediaFilePath] = useState(null);
    const [subtitleTracks, setSubtitleTracks] = useState([]);
    // container the video element is created inside (video.js owns the element)
    const containerRef = useRef(null);
    const playerRef = useRef(null);
    // true while we apply an action that came from another user,
    // so we don't echo it back and create a loop
    const applyingRemote = useRef(false);
    // don't broadcast anything until we've synced with the group
    const readyToEmit = useRef(false);
    // Get the server URL from environment variable or use default
    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    useEffect(() => {
        if (!open || !torrent) return;
        let active = true;
        (async () => {
            try {
                const response = await axios.get(`${serverUrl}/stream/${torrent.id}`);
                if (!active) return;
                setMediaFilePath(`${serverUrl}/media/${encodePath(response.data.mediaFilePath)}`);
                const subs = torrent.subtitleTracks || [];
                // show the first English track (or the first track) by default
                let defaultIndex = subs.findIndex(s => /english/i.test(s.language));
                if (defaultIndex === -1) defaultIndex = 0;
                setSubtitleTracks(subs.map((sub, index) => ({
                    kind: 'subtitles',
                    src: `${serverUrl}/media/${encodePath(sub.subtitlePath)}`,
                    srclang: sub.language,
                    label: sub.language,
                    default: index === defaultIndex,
                })));
                setError(null);
            } catch (err) {
                console.error('Error fetching media path:', err);
                if (active) setError('Error loading video file');
            }
        })();
        return () => { active = false; };
    }, [open, torrent, serverUrl]);

    // Initialize the video.js player once, then update sources/tracks.
    // The video element is created imperatively because video.js takes over
    // the DOM node — letting React manage it breaks under StrictMode remounts.
    useEffect(() => {
        if (!mediaFilePath || !containerRef.current) return;

        if (!playerRef.current) {
            const videoElement = document.createElement('video-js');
            videoElement.classList.add('vjs-big-play-centered');
            containerRef.current.appendChild(videoElement);

            // all downloaded subtitle tracks are handed to the player at setup
            const player = videojs(videoElement, {
                autoplay: true,
                controls: true,
                responsive: true,
                fluid: true,
                playsinline: true,
                sources: [{
                    src: mediaFilePath,
                    type: 'video/mp4'
                }],
                tracks: subtitleTracks,
            });
            playerRef.current = player;

            // when joining someone else's session, start where they are
            if (startAt)
                player.one('loadedmetadata', () => player.currentTime(startAt));

            // announce immediately so other users see this watcher right away,
            // and ask the group for its exact position
            player.one('playing', () => {
                report_watching(torrent.id, player.currentTime(), false);
                send_message({ type: 'sync-join', torrentId: torrent.id, time: player.currentTime() });
            });

            // broadcast the user's own play/pause/seek to the group
            const emitAction = (action) => {
                if (applyingRemote.current || !readyToEmit.current) return;
                send_message({
                    type: 'sync-action',
                    torrentId: torrent.id,
                    action,
                    time: player.currentTime(),
                });
            };
            player.on('pause', () => { if (!player.seeking()) emitAction('pause'); });
            player.on('play', () => emitAction('play'));
            player.on('seeked', () => emitAction('seek'));

            player.on('error', () => {
                console.error('Video.js player error:', player.error());
                setError('Error playing video. Please check if the file exists and try again.');
            });
        }
    }, [mediaFilePath, subtitleTracks, startAt, torrent]);

    // apply sync events coming from the other watchers of this movie
    useEffect(() => {
        if (!open || !torrent) return;

        // perform a change without echoing it back to the group
        const applyRemote = (change) => {
            const player = playerRef.current;
            if (!player || player.isDisposed()) return;
            applyingRemote.current = true;
            change(player);
            setTimeout(() => { applyingRemote.current = false; }, 500);
        };

        const unsubscribe = subscribe(msg => {
            if (msg.torrentId !== torrent.id) return;

            if (msg.type === 'sync-action') {
                // someone played, paused or seeked: mirror it exactly
                applyRemote(player => {
                    player.currentTime(msg.time);
                    if (msg.action === 'pause') player.pause();
                    else if (msg.action === 'play') player.play()?.catch?.(() => {});
                });
            } else if (msg.type === 'sync-state') {
                // answer to our sync-join: snap to the group's position
                applyRemote(player => {
                    if (Math.abs(player.currentTime() - msg.time) > SYNC_DRIFT_S)
                        player.currentTime(msg.time);
                    if (msg.paused && !player.paused()) player.pause();
                    else if (!msg.paused && player.paused()) player.play()?.catch?.(() => {});
                });
                // from now on our own actions steer the group too
                readyToEmit.current = true;
            } else if (msg.type === 'sync-time') {
                // periodic correction: only touch the player if it drifted
                const player = playerRef.current;
                if (!player || player.isDisposed()) return;
                const drifted = Math.abs(player.currentTime() - msg.time) > SYNC_DRIFT_S;
                const pauseMismatch = msg.paused !== player.paused();
                if (drifted || pauseMismatch)
                    applyRemote(player => {
                        if (drifted) player.currentTime(msg.time);
                        if (msg.paused && !player.paused()) player.pause();
                        else if (!msg.paused && player.paused()) player.play()?.catch?.(() => {});
                    });
            }
        });
        return unsubscribe;
    }, [open, torrent]);

    // watch-together heartbeat: report the playback position while the modal is open
    useEffect(() => {
        if (!open || !torrent) return;
        const interval = setInterval(() => {
            const player = playerRef.current;
            if (player && !player.isDisposed())
                report_watching(torrent.id, player.currentTime(), player.paused());
        }, WATCH_HEARTBEAT_MS);
        return () => {
            clearInterval(interval);
            stop_watching(torrent.id);
        };
    }, [open, torrent]);

    // dispose the player only when the modal unmounts
    useEffect(() => {
        return () => {
            if (playerRef.current && !playerRef.current.isDisposed()) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, []);

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
                        <div data-vjs-player style={{ width: '100%' }} ref={containerRef} />
                    </Box>
                )}
            </Box>
        </Modal>
    );
}
