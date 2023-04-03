import os from 'os';
import checkDiskSpace from 'check-disk-space'
import { memoryUsage } from 'process';

let path = os.platform() === 'win32' ? 'c:' : '/';
// only 20% of the disk space can be used
let percentage = 0.2;

const get_disk_left = async () => await checkDiskSpace('/')
    // get the free space
    .then(diskSpace => {
        //remove the percentage of the disk space that is want to alway be free
        const memory_buffer = diskSpace.size * percentage;
        return {
            free_bytes: parseInt(diskSpace.free - memory_buffer),
            free_human: parseInt((diskSpace.free - memory_buffer) / 1000000000) + ' GB',
            total_byte: parseInt(diskSpace.size - memory_buffer),
            total_human: parseInt((diskSpace.size - memory_buffer) / 1000000000) + ' GB',
        }
    })

const check_memeory = async size_bytes => {
    // check if there is enough memory left
    let memory_left = await get_disk_left();
    return memory_left.free_bytes < size_bytes;
}

export { get_disk_left, check_memeory }
