import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { get_torrent } from './yify-server.js';
const app = express();
import { get_disk_left, check_memeory } from './system.js';
import { get_torrents, add_torrent } from './transmission-cli.js';
import setRemoveTimer from './removeTimer.js';
import dotenv, { parse } from 'dotenv';
// load the environment variables
dotenv.config();



// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || 'localhost';

// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 3000;

 // list of accepted secret token to make the
var accepted_token = process.env.TOKEN || '123456789';

// delete the torrent after 2 hours
var deltetionTime = parseInt(process.env.DELETIONTIME) || 2; //minute

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
    if (req.body?.movie_id && req.body?.quality) {
        const { movie_id, quality } = req.body;
        console.log('movie_id:', movie_id, 'quality:', quality);
        // get the torrent from yify
        const torrent = await get_torrent(movie_id, quality);
        // check if there is enough memory left
        if (await check_memeory(torrent.size_bytes)) {
            return res.json({ error: 'not enough memory left' });
        }
        // add the torrent to the transmission
        const torrent_id = await add_torrent(torrent.url);
        if (torrent_id) {
            //  set remove timer
            setRemoveTimer(torrent_id, deltetionTime);
            return res.json({ status: 'ok' });
        } else
            return res.json({ error: 'transmission error' });
    } else
        return res.json({ error: 'bad request' });
})

app.get('/torrents', async function (req, res) {
    let torrents = await get_torrents();
    res.json(torrents);
})

// this route returns the system status of the opreationg system
app.get('/disk', async function (req, res) {
    let disk = await get_disk_left();
    res.json(disk);
})

app.listen(port, host, () => console.log(`transmission manager listening on port ${port}!`) );