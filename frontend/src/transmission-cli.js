import axios from 'axios';

let server = process.env.API_URL || 'http://localhost:3001/teracsmoviedownloader/api/';

// super secret token, don't share =P 
let token = process.env.TOKEN || '123456789';

// set headers to axios 
axios.defaults.headers.common['token'] = token;

const  transmision_add_torrent= async (suggestion, torrent, imdb_code) => {
    // this function will add a torrent to the transmission server
    // it will return true if the torrent was added successfully
    // send the request to add a toreent to the transmission server
    let res = await axios.post(`${server}/yify/add`, {
        movie_id: suggestion.id,
        imdb_code,
        quality: torrent,
    })
    return res.data.id;
}

const query_status = async () => {
    try {
        const response = await axios.get(`${server}/status`);
        return response.data;
    } catch (err) {
        throw err;
    }
}


const add_time = async (torrent_id) => {
    try {
        const response = await axios.post(`${server}/add_time`, { torrent_id });
        return response.data;
    } catch (err) {
        throw err;
    }
}

/**
 * Deletes a torrent and its files from the transmission server
 * @param {number} torrent_id - The ID of the torrent to delete
 * @returns {Promise<Object>} Response data containing updated torrents list
 */
const delete_torrent = async (torrent_id) => {
    try {
        const response = await axios.delete(`${server}/torrent/${torrent_id}`);
console.log('Torrent deleted successfully:', torrent_id);
        return response.data;
    } catch (err) {
        console.error('Error deleting torrent:', err);
        throw err;
    }
}

export { transmision_add_torrent, query_status, add_time, delete_torrent }
