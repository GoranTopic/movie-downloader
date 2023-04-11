import * as React from 'react';
//import TorrentCard from './TorrentCard.js';
import Grid from '@mui/material/Grid';
import TorrentCard from './TorrentCard.js';
import LoadingTorrentCard from './LoadingTorrentCard.js';

export default function TrasnmissionList({ torrents }) {
  /* this is a coponent that will be used to show the torrents and their status frmo the Trasnmission-remote client */

    return <>
        <Grid container
            sx={{ marginTop: 1 }}
            columns={{ xs: 1, sm: 1, md: 12, lg: 12, xl: 14 }}
            direction="column" justifyContent="space-evenly"
            rowSpacing={10}>
            { /* for each torrent map to torent card */}
            {torrents.map(torrent => torrent.status === "loading" ?
                <LoadingTorrentCard key={torrent.id} torrent={torrent} /> :
                <TorrentCard key={torrent.id} torrent={torrent} />
            )}
        </Grid>
    </>
}
