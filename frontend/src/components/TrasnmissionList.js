import * as React from 'react';
//import TorrentCard from './TorrentCard.js';
import Grid from '@mui/material/Grid';

export default function TrasnmissionList({selectStock}) {
  /* this is a coponent that will be used to show the torrents and their status frmo the Trasnmission-remote client */
  const [ torrents, seTorrents ] = React.useState([]);
  // would this be loagin if there are no query result?

    React.useEffect(() => {
        /* as soon as the compnent loads,
         * lets query transimission-remote for the list of torrents */
        // return empty list of now 
        seTorrents([]);        
    }, []);

    return <>
        <Grid container columns={{ xs: 1, sm: 1, md: 12, lg: 12, xl: 14 }}
    direction="row" justifyContent="space-evenly"
    rowSpacing={5}>
        { /* for each torrent map to torent card 
   { torrents.map( torrent =>
        <TorrentCard 
        key={torrent.id} 
        torrent={torrent}
        selectStock={selectStock} />
    ) }
    */ }
        </Grid>
        </>
}
