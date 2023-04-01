import child_process from 'child_process' 
let spawn = child_process.spawn;

let id = 9;
let minutesToDeletetion = 1;

let child = spawn('node', ['src/bgProcessRemoveTorrent.js', 
`10`, `1`], {
    detached: true,
    stdio: 'ignore'
});
// un refrence child
child.unref()
