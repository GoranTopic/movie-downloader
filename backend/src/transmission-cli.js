import Transmission from 'transmission'
import { unixTimeToHumanTime } from './utils.js';
import dotenv from 'dotenv';
// load the environment variables
dotenv.config();

/* torrent Data Structure
    torrent = { 
        id: 1,
        title: 'title',
        url: 'domain/torrents/1.torrent',
        addedDate: 1610000000,
        addedDateHuman: '2021-01-01 00:00:00',
        msToDeletetion: 1610000000,
        remainingTimeToDeletion: 1000,
        ...tranmissionTorrent
    }
*/

// get download directory from env
let download_dir = process.env.DOWNLOAD_DIR || '/home/telix/Downloads';

const minutesToDeletion = parseInt(process.env.MIN_TO_DELETION) || 60; // minute
// convert minutes to milliseconds
const msToDeletion = minutesToDeletion * 60 * 1000

console.log(`Torrents will be deleted after ${minutesToDeletion} minutes`)

// properties to delete from the torrent object
let propertiesToDelete = [
    'comment', 'priorities', 'torrentFile', 'magnetLink',
    'creator', 'downloadDir', 'error', 'errorString', 
    'trackers', 'trackerStats', 'peers', 'peersFrom', 'peersStats',
];

// properties to maintain from the movie file
let propertiesToMaintain = [
    'background_image',
    'background_image_original',
    'small_cover_image',
    'medium_cover_image',
    'large_cover_image',
];

// where we are going to store the data of the torrents
let torrents = []

// set an inteval to update the torrents list by checking transmission
setInterval(async () => {
    torrents = await update_torrents();
// update every hour
}, 1000);


let transmission = new Transmission({
    host: '0.0.0.0',
    port: 9091
})

// check the lif cycle of the torrent,
// if it is active or if ir stalled or if the delteion date as passed
// deletition 
const update_torrents = async () => {
    // get the list of torrents from transmission
    torrents = [...(await query_transmission())]
        .map(torrent => {
            torrent = {
                ...torrent, // process torrent
                // add the url of the torrent
                url: 'http://' + torrent.downloadDir + '/' + torrent.name,
                // add the date of the torrent
                addedDateHuman: unixTimeToHumanTime(torrent.addedDate),
                // time remaining to deletion
                minutesToDeletion: minutesToDeletion,
                // milliseconds remaining to deletion
                msToDeletion: msToDeletion,
                // time remaining to deletion
                remainingTimeToDeletion: (() => {
                    //console.log('torrent:', torrent.name)
                    let res;
                    let age = Date.now() - torrent.startDate * 1000;
                    if (age >= msToDeletion) res = 0
                    else res = msToDeletion - age
                    //console.log('Date.now():', Date.now(), 'torrent.startDate:', torrent.addedDate * 1000)
                    //console.log('age:', age, 'msToDeletion:', msToDeletion)
                    //console.log('res:', res)
                    return res;
                })(),
            }
            // let delte information from tramsission that the client does not need
            // delete from each torrent the following properties
            for (let property of propertiesToDelete)
                delete torrent[property]
            // for every property in propertiesToMaintain we find the corresponding torrent by id and 
            // add the property to this torrent
            for (let property of propertiesToMaintain) {
                let torrentToMaintain = torrents.find(t => t.id === torrent.id);
                if(torrentToMaintain)
                    torrent[property] = torrentToMaintain[property];
            }
            return torrent;
        })
    // check if the torrent should be deleted
    torrents.forEach(async torrent => {
        //decied torrent should be deleted
        if (torrent.remainingTimeToDeletion === 0) {
            await delete_torrent(torrent.id, true);
            torrents = torrents.filter(t => t.id !== torrent.id);
        }
    })
    //console.log('torrents:', torrents)
    return torrents;
}

// change date format from unix to human
const add_torrent = async (torrent_url, movie) => {
    let id = await new Promise(async (resolve, reject) =>
        await transmission.addUrl(
            torrent_url, // add torrent
            { "download-dir": download_dir, },
            (err, res) => {
                if (err) {
                    console.error(err);
                    reject(err)
                } else {
                    var id = res.id;
                    console.log('Torrent added to transmission.');
                    resolve(id);
                }
            }
        )
    );
    // if the torrent was added successfully
    if (id) { // let add the movie details to the torrent 
        // add torrent to the list
        torrents.push({
            ...movie,
            id: id,
        });
        return id;
    } else {
        return null;
    }
}

const delete_torrent =  async (torrent_id, delete_file=false) => 
    new Promise( async (resolve, reject ) => 
        await transmission.remove(
            torrent_id, 
            delete_file,
            (err, res) => {
                if(err)
                    reject(err); 
                else
                    resolve( true);
            }
        )
    )

const check_torrent_status =  async torrent_id => 
    new Promise( async (resolve, reject ) => 
        await transmission.get(
            torrent_id, 
            (err, res) => {
                if(err)
                    reject(err); 
                else
                    resolve( res.torrents[0] );
            }
        )
    )

const query_transmission =  async () =>  
    // this fucntions queries the tramission fot the trasnmission 
    // to get the list of torrents
    new Promise( async (resolve, reject) =>
        await transmission.get(
            (err, res) => {
                if(err)
                    reject(err); 
                else
                    resolve( res.torrents );
            }
        )
    )

const get_torrents = async () =>{
    // update the torrents 
    await update_torrents();
    // restusn list of torrents
    return torrents;
}

// Get torrent state
function getStatusType(type){
    return transmission.statusArray[type]
}

export { get_torrents, getStatusType, add_torrent, delete_torrent, check_torrent_status }
