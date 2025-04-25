import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { get_torrent, query_movie } from './yify-server.js';
import cors_proxy from 'cors-anywhere';
import path from 'path';
import fs from 'fs';
import { DOWNLOADS_PATH } from './config.js';
import archiver from 'archiver';
const app = express();
import { get_mem_stats, check_memeory } from './system.js';
import { get_torrents, add_torrent, add_time, delete_torrent, update_torrent } from './transmission-cli.js';
import { downloadAllSubtitles } from './ytsSubtitleApi.js';
import dotenv from 'dotenv';
// load the environment variables
dotenv.config();

// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || 'localhost';

// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 3001;

// CORS proxy port
var cors_proxy_port = process.env.CORS_PROXY_PORT || 8080;

// list of accepted secret token to make the
var accepted_token = process.env.TOKEN || '123456789';

// Allow requests from specific origins
var corsOptions = {
    origin: '*',
    methods: ['PUT', 'GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Content-Range', 'Token'],
    preflightContinue: false,
    optionsSuccessStatus: 200,
}
app.use(cors(corsOptions));

// parse the body of the request
app.use(bodyParser.json());

// Initialize CORS proxy
const cors_proxy_server = cors_proxy.createServer({
    originWhitelist: [], // Allow all origins
    requireHeader: ['origin', 'x-requested-with'],
    removeHeaders: ['cookie', 'cookie2'],
});

// Start CORS proxy server
cors_proxy_server.listen(cors_proxy_port, host, () => {
    console.log(`CORS proxy server running on port ${cors_proxy_port}!`);
});

// this is the route that will check it there is token in the request
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next(); // Skip token check for preflight
    }
    // Skip token check for media and stream endpoints
    if (req.url.startsWith('media/') || 
        req.url.startsWith('/stream/')) {
        return next();
    }
    
    // check header for token
    var token = req.headers['token'];
    // decode token
    if (token === accepted_token) { // verify secret token
        return next();
    } else // if token is not valid, return error
        return res.send('Silly hacker, tricks are for kids...'); 
})

// Add CORS proxy endpoint
app.get('/proxy/:url(*)', (req, res) => {
    req.url = req.url.replace('/proxy/', '/');
    // make sure that the request is going to the correct server enpoint 
    if (req.url.includes('yts')) {
        cors_proxy_server.emit('request', req, res);
    } else {
        return res.send('Silly hacker, tricks are for kids...');
    }
});

app.post('/yify/add', async function (req, res) {
    // get the url of the torrent from the request
    if (req.body?.movie_id && req.body?.quality) {
        const { movie_id, quality } = req.body;
        // query the movie from yify
        const movie = await query_movie(movie_id);
        // get the torrent from the movie object
        const torrent = get_torrent(movie, quality);
        // check if there is enough memory left
        if (await check_memeory(torrent.size_bytes))
            return res.json({ error: 'not enough memory left' });
        // add the torrent to the transmission
        const torrent_id = await add_torrent(torrent.url, movie);
        // check if the torrent was added
        if (torrent_id) // success
            return res.json({ status: 'ok', id: torrent_id });
        else // error
            return res.json({ error: 'transmission error' });
    } else // bad request
        return res.json({ error: 'bad request' });
})

// this rounte returns the list of torrents
app.get('/status', async function (req, res) {
    let torrents = await get_torrents();
    let memory = await get_mem_stats(torrents);
    res.json({ torrents, memory });
})

// Add endpoint to extend torrent deletion time
app.post('/add_time', async function (req, res) {
    if (req.body?.torrent_id) {
        const { torrent_id } = req.body;
        // add 30 minutes to the torrent
        let response = await add_time(torrent_id);
        res.json(response);
    } else {
        res.json({ error: 'bad request' });
    }
})

// Add endpoint for downloading movie files
app.get('/download/:filename', async (req, res) => {
    const filename = decodeURIComponent(req.params.filename);
    const filePath = path.join(DOWNLOADS_PATH, filename);
    
    // Check if path exists
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    // If it's a directory, create a zip file
    if (fs.statSync(filePath).isDirectory()) {
        try {
            // Create a zip archive
            const archive = archiver('zip', {
                zlib: { level: 9 } // Maximum compression
            });

            // Set the response headers
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.zip"`);

            // Pipe the archive to the response
            archive.pipe(res);

            // Add the directory to the archive
            archive.directory(filePath, false);

            // Finalize the archive
            await archive.finalize();

            // Handle archive errors
            archive.on('error', (err) => {
                console.error('Archive error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Error creating archive' });
                }
            });
        } catch (error) {
            console.error('Error creating zip:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error creating zip file' });
            }
        }
    } else {
        // If it's a file, download it directly
        res.download(filePath, filename, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Error downloading file' });
                }
            }
        });
    }
});

// Serve static files from a 'public' folder
app.use('/media', express.static(DOWNLOADS_PATH));

// Video streaming endpoint
app.get('/stream/:torrentId', async (req, res) => {
    try {
        console.log('Stream request received for torrent:', req.params.torrentId);
        const torrentId = parseInt(req.params.torrentId);
        const torrents = await get_torrents();
        const torrent = torrents.find(t => t.id === torrentId);
        
        if (!torrent) {
            console.error('Torrent not found:', torrentId);
            return res.status(404).json({ error: 'Torrent not found' });
        }

        // Get the file path from the torrent
        const filePath = path.join(DOWNLOADS_PATH, torrent.name);
        console.log('Looking for file at:', filePath);
        
        // Check if path exists
        if (!fs.existsSync(filePath)) {
            console.error('File not found:', filePath);
            return res.status(404).json({ error: 'File not found' });
        }

        let mediaFilePath = filePath;
        let subtitleFiles = [];
        
        // If it's a directory, find the largest media file and all subtitle files
        if (fs.statSync(filePath).isDirectory()) {
            const mediaFiles = [];
            const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm'];
            
            // Recursively find all media and subtitle files
            const findFiles = (dir) => {
                const files = fs.readdirSync(dir);
                files.forEach(file => {
                    const fullPath = path.join(dir, file);
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        findFiles(fullPath);
                    } else {
                        const ext = path.extname(file).toLowerCase();
                        if (videoExtensions.includes(ext)) {
                            mediaFiles.push({ path: fullPath, size: stat.size });
                        } 
                    }
                });
            };

            findFiles(filePath);
            
            if (mediaFiles.length === 0) {
                console.error('No media files found in directory');
                return res.status(404).json({ error: 'No media files found' });
            }

            // Find the largest file
            mediaFilePath = mediaFiles.reduce((prev, current) => 
                (prev.size > current.size) ? prev : current
            ).path;
        }

        // Convert absolute paths to relative paths
        const relativeMediaPath = path.relative(DOWNLOADS_PATH, mediaFilePath);

        console.log('Found media file:', relativeMediaPath);

        return res.json({ 
            mediaFilePath: relativeMediaPath,
        });
        
    } catch (error) {
        console.error('Streaming error:', error);
        res.status(500).json({ error: 'Error streaming file' });
    }
});

// Add endpoint for fetching subtitles
app.get('/yify/subtitles/:torrentId/:imdbCode', async (req, res) => {
    try {
        console.log('Fetching subtitles for torrent:', req.params.torrentId, 'with IMDB code:', req.params.imdbCode);
        const { torrentId, imdbCode } = req.params;
        const torrents = await get_torrents();
        const torrent = torrents.find(t => t.id === parseInt(torrentId));
        
        if (!torrent) {
            return res.status(404).json({ error: 'Torrent not found' });
        }

        // Get the download directory for this torrent
        const downloadDir = path.join(DOWNLOADS_PATH + '/' + torrent.name + '/subs');
        
        if (!fs.existsSync(downloadDir)) 
            // make the directory
            fs.mkdirSync(downloadDir, { recursive: true });
        
        // Download subtitles using the new handler
        const downloadedSubs = await downloadAllSubtitles(imdbCode, downloadDir);

        let subtitleFiles = downloadedSubs.map(sub => ({
            language: sub.language,
            subtitlePath: torrent.name + '/subs/' + sub.subtitlePath
        }));
        // save in torrent object
        let updatedTorrent = await update_torrent( parseInt(torrentId), {
            ...torrent,
            subtitleTracks: subtitleFiles
        });
        // return the updated torrent
        res.json({ 
            status: 'ok',
            message: 'Subtitles downloaded successfully',
            torrent: updatedTorrent
        });
    } catch (error) {
        console.error('Error in subtitle endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add endpoint to delete a torrent
app.delete('/torrent/:id', async function (req, res) {
    try {
        const torrentId = parseInt(req.params.id);
        if (isNaN(torrentId)) {
            return res.status(400).json({ error: 'Invalid torrent ID' });
        }
        
        // Find the torrent to get its path
        const torrents = await get_torrents();
        const torrent = torrents.find(t => t.id === torrentId);
        
        if (!torrent) {
            return res.status(404).json({ error: 'Torrent not found' });
        }
        
        // Create the directory path
        const dirPath = path.join(DOWNLOADS_PATH, torrent.name);
        
        // Always delete files with torrent
        console.log(`Deleting torrent ${torrentId}`);
        
        await delete_torrent(torrentId, dirPath, true);
        
        // Update the torrents list
        const updatedTorrents = await get_torrents();
        
        return res.json({ 
            status: 'ok', 
            message: `Torrent ${torrentId} deleted successfully`,
            torrents: updatedTorrents
        });
    } catch (error) {
        console.error('Error deleting torrent:', error);
        return res.status(500).json({ 
            error: 'Failed to delete torrent',
            message: error.message 
        });
    }
});

app.listen(port, host, () => console.log(`transmission manager listening on port ${port}!`) );
