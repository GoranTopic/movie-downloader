import express from 'express';
import { get_torrent } from './yify-cli.js';
const app = express();

import { get_disk_left, check_memeory } from './system.js';
import { get_torrents } from './transmission-cli.js';


// Listen on a specific host via the HOST environment variable
//var host = process.env.HOST || '147.182.241.239';
var host = process.env.HOST || 'localhost';

// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 4237;

 // list of accepted secret token to make the
var accepted_token = process.env.TOKEN || '5df54d27-26d0-43ce-aef1-34d71e0b0dbb' 

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

app.post('/yify/torrent', async function (req, res) {
    // get the url of the torrent from the request
    if (req.body?.id && req.body?.quality) {
        const { id, quality } = req.body;
        // get the torrent from yify
        const torrent = await get_torrent(id, quality);
        console.log('torret:', torrent);
        // check if there is enough memory left
        if (check_memeory(torrent.size_bytes))
            return res.json({ error: 'not enough memory left' });
        // add the torrent to the transmission
        const outcome = await add_torrent(torrent.url);
        console.log('outcome:', outcome);
        // return the outcome
        return res.json(outcome);
    } else
        return res.json({ error: 'request' });
})

app.get('/yify/torrents', async function (req, res) {
    let torrents = await get_torrents();
    res.json(torrents);
})

// this route returns the system status of the opreationg system
app.get('/disk', async function (req, res) {
    let stats = await get_system_stats();
    res.json(stats);
})

app.listen(port, host, () => console.log(`transmission manager listening on port ${port}!`) );