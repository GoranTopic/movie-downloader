import axios from 'axios';

let server = process.env.REACT_APP_API_URL || 'http://localhost:3001'

// super secret token, don't share =P 
let token = process.env.REACT_APP_TOKEN || '123456789';


const fetch_download = async (name) => {
    try {
        // Get the filename from the filePath
        const filename = encodeURIComponent(name);
        const response = await fetch(`${server}/download/${filename}`, {
            headers: {
                token,
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
        a.download = name;
        document.body.appendChild(a);
        a.click();
        // Cleanup
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
        return true;
    } catch (error) {
        console.error('Download error:', error);
    }
}
         


export { fetch_download };
