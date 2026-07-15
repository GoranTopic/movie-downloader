let server = process.env.REACT_APP_API_URL || 'http://localhost:3001'

// hand the download to the browser's own download manager:
// it starts instantly, shows real progress, and can pause/resume.
// (the old approach buffered the whole movie in memory first)
const fetch_download = (torrent) => {
    const a = document.createElement('a');
    a.href = `${server}/download/${torrent.id}`;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export { fetch_download };
