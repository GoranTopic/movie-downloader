import * as React from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Grow from '@mui/material/Grow';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import MovieFilterIcon from '@mui/icons-material/MovieFilter';
import TorrentCard from './TorrentCard.js';
import LoadingTorrentCard from './LoadingTorrentCard.js';

// grey placeholder cards shown before the first status arrives
const SkeletonCard = () => (
    <Box sx={{ marginY: 1, marginX: '5%' }}>
        <Skeleton variant="rounded" height={150} sx={{ borderRadius: 3 }} />
    </Box>
);

export default function TrasnmissionList({ torrents, setTorrents, onPlay, user, loaded }) {
  /* this is a coponent that will be used to show the torrents and their status frmo the Trasnmission-remote client */

    // still waiting for the first status update
    if (!loaded)
        return <><SkeletonCard /><SkeletonCard /></>;

    // nothing downloading yet: friendly hint instead of a blank page
    if (torrents.length === 0)
        return (
            <Box sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 1, marginTop: 8, color: 'text.secondary',
            }}>
                <MovieFilterIcon sx={{ fontSize: 56, opacity: 0.5 }} />
                <Typography variant="h6">No movies yet</Typography>
                <Typography variant="body2">Search for a movie above to start downloading.</Typography>
            </Box>
        );

    return <>
        <Grid container
            sx={{ marginTop: 1 }}
            columns={{ xs: 1, sm: 1, md: 12, lg: 12, xl: 14 }}
            direction="column" justifyContent="space-evenly"
            rowSpacing={10}>
            { /* for each torrent map to torent card */}
            {torrents.map(torrent => torrent.status === "loading" ?
                <LoadingTorrentCard key={torrent.id + torrent.imdb_code} torrent={torrent} /> :
                <Grow in={true} key={torrent.id} timeout={350}>
                    <div>
                        <TorrentCard
                            torrent={torrent}
                            setTorrents={setTorrents}
                            onPlay={onPlay}
                            user={user}
                        />
                    </div>
                </Grow>
            )}
        </Grid>
    </>
}
