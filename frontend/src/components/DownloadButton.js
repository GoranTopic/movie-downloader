import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export default function DownloadButton({ torrent }) {
    const [loading, setLoading] = React.useState(false);

    const handleDownload = async () => {
        setLoading(true);
        try {
            // Get the filename from the filePath
            const filename = encodeURIComponent(torrent.name);
            const response = await fetch(`http://localhost:3001/download/${filename}`, {
                headers: {
                    'token': '123456789' // Add your token here
                }
            });

            if (!response.ok) {
                throw new Error('Download failed');
            }
            // Get the blob from the response
            const blob = await response.blob();
            // Create a blob URL and trigger download
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = torrent.name;
            document.body.appendChild(a);
            a.click();
            // Cleanup
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download error:', error);
            // You might want to show an error message to the user here
        } finally {
            setLoading(false);
        }
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