import * as React from 'react';
//import TorrentCard from './TorrentCard.js';
import Grid from '@mui/material/Grid';
import { query_torrents } from '../transmission-cli.js';
import TorrentCard from './TorrentCard.js';

export default function TrasnmissionList() {
  /* this is a coponent that will be used to show the torrents and their status frmo the Trasnmission-remote client */
    const [torrents, setTorrents] = React.useState([]);
  // would this be loagin if there are no query result?

    React.useEffect(() => {
        /* as soon as the compnent loads,
         * lets query transimission-remote for the list of torrents */
        // return empty list of now 
        setInterval(async () => {
            // query the transmission server for the list of torrents
            let new_torrents = await query_torrents();
            console.log("torrents:", new_torrents);
            // update the state with the new list of torrents
            setTorrents([...new_torrents]);
        }, 20000);
    }, []);

    // delete torrent from transmission server
    const deleteTorrent = async torrent_id => {
        // delete the torrent from the transmission server
        //let res = await trasmission_delete_torrent(torrent_id);
        //console.log('res:', res);
    }


    return <>
        <Grid container
            sx={{ marginTop: 2 }}
            columns={{ xs: 1, sm: 1, md: 12, lg: 12, xl: 14 }}
            direction="column" justifyContent="space-evenly"
            rowSpacing={5}>
            { /* for each torrent map to torent card */}
            {torrents.map(torrent => <TorrentCard
                key={torrent.id}
                torrent={torrent}
            //deleteTorrent={deleteTorrent}
            //downloadTorrent={downloadTorrent}
            />
            )}
        </Grid>
    </>
}
