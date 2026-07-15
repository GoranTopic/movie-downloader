import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { get_torrent, query_movie, query_movie_suggestions } from './yify-server.js';
import path from 'path';
import fs from 'fs';
import { DOWNLOADS_PATH } from './config.js';
const app = express();
import { get_mem_stats, check_memeory } from './system.js';
import { get_torrents, add_torrent, add_time, delete_torrent, update_torrent } from './transmission-cli.js';
import { downloadAllSubtitles } from './ytsSubtitleApi.js';
import { signup, login, google_login, create_guest, verify_email, verify_user_token } from './users.js';
import { send_verification_email } from './mailer.js';
import { OAuth2Client } from 'google-auth-library';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
// load the environment variables
dotenv.config();

// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || 'localhost';

// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 3001;

// list of accepted secret token to make the
var accepted_token = process.env.TOKEN || '123456789';

// Allow requests from specific origins
var corsOptions = {
    origin: '*',
    methods: ['PUT', 'GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Content-Range', 'Token', 'User-Token'],
    preflightContinue: false,
    optionsSuccessStatus: 200,
}
app.use(cors(corsOptions));

// parse the body of the request
app.use(bodyParser.json());

// this is the route that will check it there is token in the request
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        console.log('Preflight request received');
        return next(); // Skip token check for preflight
    }
    // Skip token check for media, stream and download endpoints
    // (downloads are plain browser navigations, which can't send headers),
    // and for the email verification link (opened straight from the inbox)
    if (req.url.startsWith('/media/') ||
        req.url.startsWith('/stream/') ||
        req.url.startsWith('/download/') ||
        req.url.startsWith('/auth/verify/')) {
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

// resolve the logged-in user from the user-token header (if any)
app.use((req, res, next) => {
    req.user = verify_user_token(req.headers['user-token']);
    next();
})

// where the verification link points (must be reachable from the user's browser)
const PUBLIC_API_URL = process.env.PUBLIC_API_URL || `http://localhost:${port}`;

// create a new account; if no username is given a random one is assigned.
// a verification email is sent before the account can be used
app.post('/auth/signup', async (req, res) => {
    const { username, password, email } = req.body || {};
    const result = signup(username, password, email);
    if (result.error) return res.json(result);
    try {
        const verifyLink = `${PUBLIC_API_URL}/auth/verify/${result.verifyToken}`;
        await send_verification_email(result.email, result.username, verifyLink);
    } catch (err) {
        console.error('Error sending verification email:', err);
        return res.json({ error: 'could not send the verification email, try again later' });
    }
    return res.json({
        status: 'verification-sent',
        username: result.username,
        email: result.email,
    });
})

// ---- sign in with google ----
// create the OAuth client id at console.cloud.google.com and put it in
// GOOGLE_CLIENT_ID; the frontend hides the google button when it's not set
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// tells the frontend which auth options are available
app.get('/auth/config', (req, res) => {
    return res.json({ googleClientId: GOOGLE_CLIENT_ID });
})

// the google sign-in button posts its ID token here; we verify it
// against google's keys and log the user in (creating them if needed)
app.post('/auth/google', async (req, res) => {
    if (!googleClient)
        return res.json({ error: 'google sign-in is not configured on this server' });
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: req.body?.credential,
            audience: GOOGLE_CLIENT_ID,
        });
        const profile = ticket.getPayload();
        return res.json(google_login({
            email: profile.email,
            name: profile.name || profile.given_name,
            googleId: profile.sub,
        }));
    } catch (err) {
        console.error('Google sign-in failed:', err.message);
        return res.json({ error: 'google sign-in failed, please try again' });
    }
})

// the link from the verification email lands here
app.get('/auth/verify/:verifyToken', (req, res) => {
    const result = verify_email(req.params.verifyToken);
    res.setHeader('Content-Type', 'text/html');
    if (result.error)
        return res.send(`<h2>Verification failed</h2><p>${result.error}</p>`);
    return res.send(`<h2>Email verified!</h2>`
        + `<p>Welcome, <b>${result.username}</b>. You can close this tab and log in to Movie Downloader.</p>`);
})

// log an existing user in
app.post('/auth/login', (req, res) => {
    const { username, password } = req.body || {};
    return res.json(login(username, password));
})

// create a guest identity with a random name (no password needed)
app.post('/auth/guest', (req, res) => {
    return res.json(create_guest());
})

// check who the current user is (used to validate stored sessions)
app.get('/auth/me', (req, res) => {
    if (req.user) return res.json({ username: req.user.username, guest: req.user.guest });
    return res.json({ error: 'not logged in' });
})

// Add CORS proxy endpoint
app.get('/search/:term', async (req, res) => {
    // get params from the request
    let term = req.params.term;
    // query the movie from yify for suggestions
    let response = await query_movie_suggestions(term)
    return res.json(response);
});

// how many movies each user can have at the same time:
// signed-in members get 6, guests only 1
const MAX_MOVIES_MEMBER = parseInt(process.env.MAX_MOVIES_PER_USER) || 6;
const MAX_MOVIES_GUEST = parseInt(process.env.GUEST_MAX_MOVIES) || 1;

// how long movies live: signed-in users get 24 hours, guests only 4
const MEMBER_LIFESPAN_MS = (parseInt(process.env.MIN_TO_DELETION) || 1440) * 60 * 1000;
const GUEST_LIFESPAN_MS = (parseInt(process.env.GUEST_MIN_TO_DELETION) || 240) * 60 * 1000;

app.post('/yify/add', async function (req, res) {
    // only logged-in users can download, so we know who added what
    if (!req.user)
        return res.status(401).json({ error: 'login required' });
    // each user can only have a limited number of movies at once
    const max_movies = req.user.guest ? MAX_MOVIES_GUEST : MAX_MOVIES_MEMBER;
    const own_torrents = (await get_torrents()).filter(t => t.owner === req.user.username);
    if (own_torrents.length >= max_movies)
        return res.json({
            error: req.user.guest
                ? `Guests can only have ${MAX_MOVIES_GUEST} movie at a time — sign in to get ${MAX_MOVIES_MEMBER}.`
                : `You already have ${MAX_MOVIES_MEMBER} movies. Delete one to download another.`
        });
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
        // add the torrent to the transmission, marked with the user who added it;
        // guests get a shorter lifespan than signed-in users
        const torrent_id = await add_torrent(torrent.url, {
            ...movie,
            owner: req.user.username,
            msLifeSpan: req.user.guest ? GUEST_LIFESPAN_MS : MEMBER_LIFESPAN_MS,
        });
        // check if the torrent was added
        if (torrent_id) // success
            return res.json({ status: 'ok', id: torrent_id });
        else // error
            return res.json({ error: 'transmission error' });
    } else // bad request
        return res.json({ error: 'bad request' });
})

// ---- watch together ----
// the websocket server is created at the bottom, next to app.listen
let wss = null;

// who is watching which movie right now:
// { torrentId: { username: { username, time, paused, updatedAt } } }
const live_watchers = {};

// shared playback state per movie, so everyone watching stays in lockstep:
// { torrentId: { time, paused, updatedAt } }
const watch_state = {};

// where each user stopped watching each movie, persisted across restarts:
// { torrentId: { username: seconds } }
const PROGRESS_PATH = path.join(process.cwd(), 'data', 'watch-progress.json');
let watch_progress = {};
try {
    watch_progress = JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf8'));
} catch {
    watch_progress = {};
}
const save_progress = () => {
    fs.mkdirSync(path.dirname(PROGRESS_PATH), { recursive: true });
    fs.writeFileSync(PROGRESS_PATH, JSON.stringify(watch_progress, null, 2));
}
const remember_position = (torrent_id, username, time) => {
    if (typeof time !== 'number' || time <= 0) return;
    watch_progress[torrent_id] = watch_progress[torrent_id] || {};
    watch_progress[torrent_id][username] = time;
    save_progress();
}

// the current canonical position of a group (time advances while playing)
const canonical_state = (state) => ({
    time: state.time + (state.paused ? 0 : (Date.now() - state.updatedAt) / 1000),
    paused: state.paused,
});
// a watcher is dropped when the player stops sending heartbeats
const WATCHER_TIMEOUT_MS = 20 * 1000;

// return the still-active watchers of a torrent
const fresh_watchers = (torrent_id) => {
    const entry = live_watchers[torrent_id] || {};
    for (const name of Object.keys(entry))
        if (Date.now() - entry[name].updatedAt > WATCHER_TIMEOUT_MS)
            delete entry[name];
    return Object.values(entry);
};

// send a message to specific users over the websocket
const send_to_users = (usernames, message) => {
    if (!wss) return;
    const payload = JSON.stringify(message);
    for (const client of wss.clients)
        if (client.readyState === 1 && client.username && usernames.has(client.username))
            client.send(payload);
}

// heartbeat sent by the media player while a user is watching
app.post('/watching/:torrentId', async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'login required' });
    const torrent_id = parseInt(req.params.torrentId);
    const { time, paused } = req.body || {};
    if (isNaN(torrent_id) || typeof time !== 'number')
        return res.json({ error: 'bad request' });
    live_watchers[torrent_id] = live_watchers[torrent_id] || {};
    // remember whether this user just joined (first heartbeat)
    const is_new = !fresh_watchers(torrent_id).some(w => w.username === req.user.username);
    live_watchers[torrent_id][req.user.username] = {
        username: req.user.username,
        time,
        paused: !!paused,
        updatedAt: Date.now(),
    };
    // remember the position so the user can resume here later
    remember_position(torrent_id, req.user.username, time);
    // tell everyone already watching this movie that someone joined
    if (is_new) {
        const others = new Set(fresh_watchers(torrent_id).map(w => w.username));
        others.delete(req.user.username);
        if (others.size) {
            const torrents = await get_torrents();
            const movie = torrents.find(t => t.id === torrent_id)?.name || 'the movie';
            send_to_users(others, {
                type: 'watcher-joined',
                torrentId: torrent_id,
                username: req.user.username,
                movie,
            });
        }
    }
    return res.json({ status: 'ok' });
})

// the user closed the player; the body may carry the exact final position
app.delete('/watching/:torrentId', (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'login required' });
    const torrent_id = parseInt(req.params.torrentId);
    // save the precise position at the moment the player was closed
    if (typeof req.body?.time === 'number')
        remember_position(torrent_id, req.user.username, req.body.time);
    if (live_watchers[torrent_id])
        delete live_watchers[torrent_id][req.user.username];
    // when the last watcher leaves, forget the shared playback position
    if (!fresh_watchers(torrent_id).length)
        delete watch_state[torrent_id];
    return res.json({ status: 'ok' });
})

// the full status: torrents (with live watchers) and memory
const status_payload = async () => {
    let torrents = await get_torrents();
    let memory = await get_mem_stats(torrents);
    // drop saved positions of movies that no longer exist
    const existing = new Set(torrents.map(t => String(t.id)));
    let pruned = false;
    for (const key of Object.keys(watch_progress))
        if (!existing.has(key)) {
            delete watch_progress[key];
            pruned = true;
        }
    if (pruned) save_progress();
    // attach who is watching each movie, with how stale their position is,
    // and where each user last stopped watching
    torrents = torrents.map(t => ({
        ...t,
        watchers: fresh_watchers(t.id).map(w => ({
            username: w.username,
            time: w.time,
            paused: w.paused,
            ago: (Date.now() - w.updatedAt) / 1000,
        })),
        progress: watch_progress[t.id] || {},
    }));
    return { torrents, memory };
}

// this rounte returns the list of torrents
// (kept as a fallback for when the websocket is not connected)
app.get('/status', async function (req, res) {
    res.json(await status_payload());
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

// find the actual movie file of a torrent: the torrent's path itself
// when it is a single file, otherwise the largest video file inside
const find_media_file = (torrent) => {
    const filePath = path.join(DOWNLOADS_PATH, torrent.name);
    if (!fs.existsSync(filePath)) return null;
    if (!fs.statSync(filePath).isDirectory()) return filePath;

    const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm'];
    const mediaFiles = [];
    const findFiles = (dir) => {
        for (const file of fs.readdirSync(dir)) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) findFiles(fullPath);
            else if (videoExtensions.includes(path.extname(file).toLowerCase()))
                mediaFiles.push({ path: fullPath, size: stat.size });
        }
    };
    findFiles(filePath);
    if (mediaFiles.length === 0) return null;
    return mediaFiles.reduce((prev, current) =>
        prev.size > current.size ? prev : current).path;
};

// download the movie file itself, streamed straight from disk.
// no zipping: instant start, real Content-Length so the browser shows
// progress, and Range support so downloads can pause and resume
app.get('/download/:torrentId', async (req, res) => {
    try {
        const torrentId = parseInt(req.params.torrentId);
        if (isNaN(torrentId))
            return res.status(400).json({ error: 'Invalid torrent ID' });
        const torrents = await get_torrents();
        const torrent = torrents.find(t => t.id === torrentId);
        if (!torrent)
            return res.status(404).json({ error: 'Torrent not found' });
        const mediaFilePath = find_media_file(torrent);
        if (!mediaFilePath)
            return res.status(404).json({ error: 'No media file found' });
        res.download(mediaFilePath, path.basename(mediaFilePath), (err) => {
            if (err && !res.headersSent) {
                console.error('Error downloading file:', err);
                res.status(500).json({ error: 'Error downloading file' });
            }
        });
    } catch (error) {
        console.error('Download error:', error);
        if (!res.headersSent)
            res.status(500).json({ error: 'Error downloading file' });
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

        // Find the movie file (single file, or largest video in the folder)
        const mediaFilePath = find_media_file(torrent);
        if (!mediaFilePath) {
            console.error('No media files found for torrent:', torrent.name);
            return res.status(404).json({ error: 'No media files found' });
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
app.get('/subtitles/:torrentId/:imdbCode', async (req, res) => {
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

        // only the user who added a movie may delete it
        if (!req.user)
            return res.status(401).json({ error: 'login required' });
        if (torrent.owner && torrent.owner !== req.user.username)
            return res.status(403).json({ error: `Only ${torrent.owner} can delete this movie` });

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

const server = app.listen(port, host, () => console.log(`transmission manager listening on port ${port}!`) );

// ---- websocket: live status updates + watch-together notifications ----
wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
    // authenticate the connection with the same tokens as the http api
    const params = new URL(req.url, `http://${req.headers.host || 'localhost'}`).searchParams;
    if (params.get('token') !== accepted_token)
        return ws.close(4001, 'invalid token');
    const user = verify_user_token(params.get('user-token'));
    // remember who this connection belongs to (may be null before login)
    ws.username = user ? user.username : null;
    // send the current status right away so the client renders instantly
    status_payload()
        .then(payload => ws.readyState === 1 && ws.send(JSON.stringify({ type: 'status', ...payload })))
        .catch(err => console.error('Error sending initial status:', err));

    // watch-together sync messages from the media player
    ws.on('message', (data) => {
        if (!ws.username) return;
        let msg;
        try { msg = JSON.parse(data); } catch { return; }
        const torrent_id = parseInt(msg.torrentId);
        if (isNaN(torrent_id)) return;

        if (msg.type === 'sync-join') {
            // a player opened: hand back the group's position, or start
            // the group at this user's position if they are the first
            if (!watch_state[torrent_id] && typeof msg.time === 'number')
                watch_state[torrent_id] = { time: msg.time, paused: false, updatedAt: Date.now() };
            const state = watch_state[torrent_id];
            if (state && ws.readyState === 1)
                ws.send(JSON.stringify({
                    type: 'sync-state',
                    torrentId: torrent_id,
                    ...canonical_state(state),
                }));
        } else if (msg.type === 'sync-action'
            && ['play', 'pause', 'seek'].includes(msg.action)
            && typeof msg.time === 'number') {
            // one user played/paused/seeked: update the group state
            const was_paused = watch_state[torrent_id]?.paused ?? false;
            watch_state[torrent_id] = {
                time: msg.time,
                paused: msg.action === 'pause' ? true
                    : msg.action === 'play' ? false
                    : was_paused,
                updatedAt: Date.now(),
            };
            // ...and mirror the action to everyone else watching
            const others = new Set(fresh_watchers(torrent_id).map(w => w.username));
            others.delete(ws.username);
            send_to_users(others, {
                type: 'sync-action',
                torrentId: torrent_id,
                action: msg.action,
                time: msg.time,
                username: ws.username,
            });
        }
    });
});

// periodically re-sync every group so drifted players catch up
const SYNC_INTERVAL_MS = 10000;
setInterval(() => {
    for (const key of Object.keys(watch_state)) {
        const torrent_id = parseInt(key);
        const watchers = fresh_watchers(torrent_id);
        // last watcher gone: forget the group position
        if (!watchers.length) {
            delete watch_state[key];
            continue;
        }
        // nobody to sync with
        if (watchers.length < 2) continue;
        send_to_users(new Set(watchers.map(w => w.username)), {
            type: 'sync-time',
            torrentId: torrent_id,
            ...canonical_state(watch_state[key]),
        });
    }
}, SYNC_INTERVAL_MS);

// push live status to every connected client
const WS_BROADCAST_MS = 2000;
setInterval(async () => {
    if (!wss.clients.size) return;
    try {
        const payload = JSON.stringify({ type: 'status', ...(await status_payload()) });
        for (const client of wss.clients)
            if (client.readyState === 1) client.send(payload);
    } catch (err) {
        console.error('Error broadcasting status:', err);
    }
}, WS_BROADCAST_MS);
