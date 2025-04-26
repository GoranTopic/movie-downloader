import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { fetch_download } from '../media-cli.js'

export default function DownloadButton({ torrent }) {
    const [loading, setLoading] = React.useState(false);

    const handleDownload = async () => {
        setLoading(true);
        // You might want to show an error message to the user here
        await fetch_download(torrent.name);
        setLoading(false);
    };

    return (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <IconButton
                onClick={handleDownload}
                aria-label="download"
                size="large"
                disabled={loading}>
                <FileDownloadIcon 
                    sx={{ width: '2rem', height: '2rem' }}
                    color="primary" 
                />
            </IconButton>
            {loading && (
                <CircularProgress
                    size={48}
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        marginTop: '-24px',
                        marginLeft: '-24px',
                    }}
                />
            )}
        </Box>
    );
} 
