import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';

export default function LoadingTorrentCard({ torrent }) {
    return (
        <Card sx={{ display: 'flex', marginY: 1, marginX: "5%" }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
                <Skeleton sx={{ width: '8rem', height: '100%' }} animation="wave" variant="rectangular" />
                <CardContent sx={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Skeleton sx={{ marginBottom: 1 }} animation="wave" height={30} width="30%" />
                        <Skeleton sx={{ marginBottom: 2 }} animation="wave" height={10} width="25%" />
                        <Skeleton sx={{ marginBottom: 2 }} animation="wave" height={20} width="100%" />
                        <Skeleton sx={{ marginBottom: 3 }} animation="wave" height={10} width="25%" />
                    </Box>
                </CardContent>
            </Box >
            <Box sx={{ display: 'flex', flexDirection: 'column' }} >
                <Skeleton sx={{ marginY: 1, marginX: 3}} variant="circular" animation="wave" height={80} width={80} />
                <Skeleton sx={{ marginY: 1, marginX: 3 }} variant="rectangular" animation="wave" height={60} width={60} />
            </Box>
        </Card >
    );
}
