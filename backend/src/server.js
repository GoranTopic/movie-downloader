import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { get_torrent, query_movie } from './yify-server.js';
const app = express();
import { get_mem_stats, check_memeory } from './system.js';
import { get_torrents, add_torrent } from './transmission-cli.js';
import dotenv from 'dotenv';
// load the environment variables
dotenv.config();

// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || 'localhost';

// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 3000;

 // list of accepted secret token to make the
var accepted_token = process.env.TOKEN || '123456789';

// Allow requests from specific origins
var corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200 
}
app.use(cors(corsOptions));

// parse the body of the request
app.use(bodyParser.json());

// this is the route that will check it there is token in the request
app.use((req, res, next) => {
    // check header for token
    var token = req.headers['x-access-token'];
    // decode token
    if (token !== accepted_token) { // verify secret token
        return next();
    } else // if token is not valid, return error
        return res.send('Silly hacker, tricks are for kids...'); 
})

app.post('/yify/add', async function (req, res) {
    // get the url of the torrent from the request
    console.log('req.body:', req.body);
    if (req.body?.movie_id && req.body?.quality) {
        const { movie_id, quality } = req.body;
        // query the movie from yify
        const movie = await query_movie(movie_id);
        console.log('movies;', movie);
        // get the torrent from the movie object
        const torrent = get_torrent(movie, quality);
        console.log('torrent:', torrent);
        // check if there is enough memory left
        if (await check_memeory(torrent.size_bytes))
            return res.json({ error: 'not enough memory left' });
        // add the torrent to the transmission
        const torrent_id = await add_torrent(torrent.url, movie);
        console.log('torrent_id:', torrent_id);
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


app.listen(port, host, () => console.log(`transmission manager listening on port ${port}!`) );