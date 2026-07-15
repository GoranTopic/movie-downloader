import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { fetch_download } from '../media-cli.js'

export default function DownloadButton({ torrent }) {
    return (
        <Tooltip title="Download to this device" arrow>
            <IconButton
                onClick={() => fetch_download(torrent)}
                aria-label="download"
                size="large">
                <FileDownloadIcon
                    sx={{ width: '2rem', height: '2rem' }}
                    color="primary"
                />
            </IconButton>
        </Tooltip>
    );
}
