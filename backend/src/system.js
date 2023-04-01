import os from 'os';
import checkDiskSpace from 'check-disk-space'

let path = os.platform() === 'win32' ? 'c:' : '/';
// only 20% of the disk space can be used
let percentage = 0.2;

const get_disk_left = async () => await checkDiskSpace('/')
    // get the free space
    .then(diskSpace => ({
        bytes: parseInt(diskSpace.free - (diskSpace.size * percentage)),
        human: parseInt((diskSpace.free - (diskSpace.size * percentage)) / 1000000000) + ' GB',
    }))

const check_memeory = async size_bytes => {
    // check if there is enough memory left
    let memory_left = await get_memeory_left();
    return memory_left.bytes < size_bytes;
}

export { get_disk_left, check_memeory }
