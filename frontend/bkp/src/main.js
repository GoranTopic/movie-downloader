import { query_movies, get_torrent_url } from './yifyCli.js'
import { getStatusType, add_torrent, delete_torrent, check_torrent_status } from './transmissionCli.js'
import prompt_sync from 'prompt-sync'
import cliProgress from 'cli-progress'
import colors from 'ansi-colors';
import child_process from 'child_process' 
let spawn = child_process.spawn;

const prompt = prompt_sync()

async function main(){ 
    const domain = 'http://147.182.241.239/.movies/'

    let movie = null;
    let movies = [];
    let isMovieSelected = false;
    // while movie not selected
    while( isMovieSelected === false){ 
        // if there are not movie queried
        if( movies.length === 0 ){
            // query use for search query
            let query = prompt("Search for movie: ");
            // get movies suggestions
            movies = await query_movies(query);
            if(movies === undefined ){ 
                console.log('no movies found');
                movies = [];
            }
        } else { 
            // print options
            movies.forEach( (m,i) => console.log(`[${i}] ${m.title} (${m.year})`) )
            // ask for input
            let input = prompt("Select movie: ");
            // convert to 
            let index = parseInt(input);
            // check input
            if( isNaN(index) ){
                console.error('Must be a number');
                // reset movies
                movies = []
            }else if( index < 0 || index >= movies.length){
                console.error('Must be a option');
            }else{ // movie was selected
                // slected input
                movie = movies[index];
                console.log(`Movie ${movie.title} selected`);
                // movie was selected
                isMovieSelected = true;
            }
        }
    }

    // get torrent url torrent file url
    let torrent = await get_torrent_url(movie.id);
    
    // pass it to transmission
    let torrent_id = await add_torrent(torrent.url);

    // start torrent
    const progessBar = new cliProgress.SingleBar({
        format: '{statusType} | {name} |' + colors.cyan('{bar}') + '| {percentage}% || {value}/{total} Chunks || Speed: {speed} | ETA: {eta}',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
    });

    progessBar.start(100, 0, {
        speed: "N/A"
    });

    // is torrent done
    let torrent_done = false;
    let statusType = null;
    let filename = '';
    while( ! torrent_done ){
        // check torrents
        let status = await check_torrent_status(torrent_id);
        //console.log(status);
        let { name, percentDone,  
            haveValid, totalSize, rateDownload, eta } = status;
        statusType = getStatusType(status.status);
        filename = name;
        // update bar
        progessBar.update( 
            Math.floor(percentDone * 100),
            {
                name: name,
                value: Math.floor(haveValid),
                total: Math.floor(totalSize),
                eta: eta/3600,
                speed: rateDownload/1000,
                statusType: statusType
            }
        );

        if( 
            getStatusType(status.status) === 'DOWNLOAD_WAIT' ||
            getStatusType(status.status) === 'STOPPED' ||
            getStatusType(status.status) === 'SEED' ||
            getStatusType(status.status) === 'SEED_WAIT' 
        ) torrent_done = true // exit loop
    }
    progessBar.stop();

    // if the torrent downloaded
    let isSetTimeout = prompt("Would you like to set a timeout to delete movie file [y/n]: ");
    let minutesToDeletetion = 0;
    if(isSetTimeout === 'y'){
        minutesToDeletetion = parseInt( prompt("Minutes to deletion: ") );
        // span a difrent process to delete torrent file
        let child = spawn('node', ['src/bgProcessRemoveTorrent.js',
            `${torrent_id}`,
            `${minutesToDeletetion}`
        ], {
            detached: true,
            stdio: 'ignore'
        });
        // unrefrence child
        child.unref();
        console.log(`${domain + '/' + encodeURI(filename)}
    will be deleted in ${minutesToDeletetion} minutes`)
    }else{
        // remove torrent file
        let isRemove = prompt("Would you like to remove the torrent file [y/n]: ");
        if(isRemove === 'y') delete_torrent(torrent_id);
        console.log(`${domain + '/' + encodeURI(filename)} was downloaded`);
    }

    /* else if it errored
        console.error(`Torrent STOPPED. something might have gone wrong
        use transmission-remote to inepect. Check the logs too`
        )
        */
    
}

main()
