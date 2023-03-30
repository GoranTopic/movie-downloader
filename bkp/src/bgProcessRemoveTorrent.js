import { delete_torrent } from './transmissionCli.js'

// get paramters 
let [ node, p, torrent_id, minutesToCountdown ] = process.argv;


// make paramters into numbers
let seconds = parseInt(minutesToCountdown) * 60
let id = parseInt(torrent_id)

let countdown = setInterval(() => {
    console.log(seconds);
    seconds--;
    if (seconds <= 0) {
        delete_torrent(id, true);
        clearInterval(countdown);
    }
}, 1000);
