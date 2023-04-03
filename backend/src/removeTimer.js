import child_process from 'child_process' 
let spawn = child_process.spawn;

const setRemoveTimer = (torrent_id, minutesToDeletetion) => {
    /* this function will set a timer to delete a torrent
    after a certain amount of time */
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
}

export default setRemoveTimer;