import Transmission from 'transmission'
import { unixTimeToHumanTime } from './utils.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { DOWNLOADS_PATH } from './config.js';
import fs from 'fs';
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

// Use the global DOWNLOADS_PATH from config
const download_dir = DOWNLOADS_PATH;

const minutesToDeletion = parseInt(process.env.MIN_TO_DELETION) || 1440; // minutes, default 24 hours
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
    'imdb_code',
    'subtitleTracks',
    'owner',
    'msLifeSpan'
];

// where torrent metadata (owner, artwork, subtitles) is persisted
// so it survives a server restart
const METADATA_PATH = process.env.TORRENT_META_PATH
    ? path.resolve(process.env.TORRENT_META_PATH)
    : path.join(process.cwd(), 'data', 'torrent-meta.json');

let torrent_meta = {};
try {
    torrent_meta = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8'));
} catch {
    torrent_meta = {};
}

const save_meta = () => {
    fs.mkdirSync(path.dirname(METADATA_PATH), { recursive: true });
    fs.writeFileSync(METADATA_PATH, JSON.stringify(torrent_meta, null, 2));
}

// keep only the properties worth persisting for a torrent
const meta_subset = (source) => Object.fromEntries(
    propertiesToMaintain
        .map(property => [property, source[property]])
        .filter(([, value]) => value !== undefined)
);

// where we are going to store the data of the torrents
let torrents = []

// set an inteval to update the torrents list by checking transmission
setInterval(async () => {
    torrents = await update_torrents();
// update every hour
}, 1000);

let transmission;
try {
    transmission = new Transmission({
        host: process.env.TRANSMISSION_HOST || '0.0.0.0',
        port: parseInt(process.env.TRANSMISSION_PORT) || 9091
    })
} catch (error) {
    console.error('Error initializing Transmission:', error);
    process.exit(1);
}

// check the lif cycle of the torrent,
// if it is active or if ir stalled or if the delteion date as passed deletition 
const update_torrents = async () => {
    // get the list of torrents from transmission
    let new_torrents = [...(await query_transmission())]
    // if the torrent is already in the torrents array, update the torrent
    // otherwise, add the torrent to the torrents array
    torrents = new_torrents.map(torrent => {
        // fall back to the persisted metadata after a restart
        let matched_torrent = torrents.find(t => t.id === torrent.id) || torrent_meta[torrent.id];
        if (matched_torrent) {
            // if the torrent is matched, merge the new torrent with the existing torrent
            torrent = { ...matched_torrent, ...torrent };
        }
        return torrent;
    })
    // update the torrents
    torrents.map(torrent => {
        /*
                                        lifespan
            |-----------------------------------------------------------|
        start date       age      remainingTimeToDeletion         deletion date
            |------------|----------------------------------------------|
        */
        // the date when the torrent was added
        torrent.msAddedDateHuman = unixTimeToHumanTime(torrent.addedDate);
        // the time the torrent will be in our system before it will be deleted
        torrent.msLifeSpan = torrent.msLifeSpan ? torrent.msLifeSpan : msToDeletion;
        // the date when the torrent will be deleted
        torrent.msDeletionDate = torrent.addedDate + torrent.msLifeSpan;
        // the age of the torrent
        torrent.msAge = Date.now() - torrent.addedDate * 1000;
        // the remaining time to deletion
        torrent.remainingTimeToDeletion = (() => {
            // if the torrent has lived longer than the time it will be in our system, return 0
            if (torrent.msAge >= torrent.msLifeSpan) return 0;
            else return torrent.msLifeSpan - torrent.msAge
        })();
        // let delete information from tramsission that the client does not need
        // delete from each torrent the following properties
        for (let property of propertiesToDelete)
            delete torrent[property]
        // for every property in propertiesToMaintain we find the corresponding torrent by id and 
        // add the property to this torrent
        for (let property of propertiesToMaintain) {
            let torrentToMaintain = torrents.find(t => t.id === torrent.id);
            if (torrentToMaintain)
                torrent[property] = torrentToMaintain[property];
        }
        return torrent;
    })
    // check if the torrent should be deleted
    torrents.forEach(async torrent => {
        //decied torrent should be deleted
        if (torrent.remainingTimeToDeletion === 0) {
            await delete_torrent(torrent.id, path.join(download_dir, torrent.name), true);
            torrents = torrents.filter(t => t.id !== torrent.id);
        }
    })
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
            imdb_code: movie.imdb_code,
        });
        // persist the metadata so ownership and artwork survive a restart
        torrent_meta[id] = meta_subset(movie);
        save_meta();
        return id;
    } else {
        return null;
    }
}

const add_time = async (torrent_id) => {
    // Find the torrent first to check its current lifespan
    const torrent = torrents.find(t => t.id === torrent_id);
    if (!torrent) {
        return { status: 'error', error: 'Torrent not found' };
    }

    // Check if the torrent's lifespan is less than 5 hours (5 * 60 * 60 * 1000 milliseconds)
    if (torrent.remainingTimeToDeletion >= 9 * 60 * 60 * 1000) {

        return { status: 'error', error: 'Maximum time limit reached (5 hours)' };
    }

    // Update the torrent's deletion time
    torrents.forEach(torrent => {
        if(torrent.id === torrent_id) {
            torrent.msLifeSpan += 30 * 60 * 1000;
        }
    });
    // Trigger an immediate update of the torrents list
    await update_torrents();
    // Return the updated torrent
    let updatedTorrent = torrents.find(torrent => torrent.id === torrent_id);
    return { status: 'ok', torrent: updatedTorrent };
};


const delete_torrent = async (torrent_id, dirpath, delete_file = true) => {
    try {
        // First, remove the torrent from transmission
        await new Promise((resolve, reject) => 
            transmission.remove(
                torrent_id, 
                delete_file,
                (err, res) => {
                    if (err) reject(err);
                    else resolve(true);
                }
            )
        );

        // Delete the directory if it exists
        if (dirpath && fs.existsSync(dirpath)) {
            try {
                // Use fs.rm with recursive option to delete directory and all contents
                await fs.promises.rm(dirpath, { recursive: true, force: true });
            } catch (dirError) {
                console.error(`Error deleting directory ${dirpath}:`, dirError);
                // Don't throw here since the torrent was already removed
            }
        }

        // Remove the torrent from our local array
        const index = torrents.findIndex(t => t.id === torrent_id);
        if (index !== -1) {
            torrents.splice(index, 1);
        }

        // drop the persisted metadata as well
        if (torrent_meta[torrent_id]) {
            delete torrent_meta[torrent_id];
            save_meta();
        }

        return true;
    } catch (error) {
        console.error(`Error in delete_torrent for ID ${torrent_id}:`, error);
        throw error;
    }
}

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

const update_torrent = async (torrent_id, torrent) => {
    // Update the torrent's deletion time
    torrents = torrents.map(t => {
        if(t.id === torrent_id){
            return { ...t, ...torrent };
        }
        return t;
    });
    // Trigger an immediate update of the torrents list
    await update_torrents();
    // Return the updated torrent
    const updated = torrents.find(torrent => torrent.id === torrent_id);
    // keep the persisted metadata in sync (e.g. subtitle tracks)
    if (updated) {
        torrent_meta[torrent_id] = { ...torrent_meta[torrent_id], ...meta_subset(updated) };
        save_meta();
    }
    return updated;
};


// Get torrent state
function getStatusType(type){
    return transmission.statusArray[type]
}

// Export Functions
export { add_torrent, get_torrents, add_time, delete_torrent, update_torrent }
