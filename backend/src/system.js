import os from 'os';
import checkDiskSpace from 'check-disk-space'

let path = os.platform() === 'win32' ? 'c:' : '/';
// only 80% of the disk space can be used
let percentage = 0.8;

let total_disk_space, claimed_disk_space, used_disk_space;

// calcualte the total disk space that can be used
const calc_free_memory = async () => {
    // for evry torrent get the total 
    total_disk_space = await (await checkDiskSpace('/')).free * percentage;
    console.log('total_disk_space:', total_disk_space);
    return total_disk_space;
}

total_disk_space = await calc_free_memory();

const get_mem_stats = async torrents => {
    // for every torrent get the total of bytes that is used
    if (torrents) {
        // calcualte the claimed disk space
        claimed_disk_space = torrents.reduce((acc, torrent) => {
            acc += torrent.totalSize;
            return acc;
        }, 0);
        // calcualte the claimed disk space
        used_disk_space = torrents.reduce((acc, torrent) => {
            acc += torrent.downloadedEver;
            return acc;
        }, 0);
        // return the stats
        return {
            used: used_disk_space,
            claimed: claimed_disk_space,
            total: total_disk_space
        };
    } else
        return null
}

const check_memeory = async size_bytes => {
    // check if there is enough memory left
    // calcualte the free memory
    let free_memory = total_disk_space - claimed_disk_space;
    return free_memory < size_bytes;
}

export { get_mem_stats, check_memeory, calc_free_memory }
