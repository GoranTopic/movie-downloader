import axios from 'axios';
//import doenv from 'dotenv';
//doenv.config();

// cors proxy
//var server = 'http://147.182.241.239:4236';
var server = 'http://localhost:4237';


// super secret token, don't share =P 
var token = '5df54d2d-26d0-43ce-aef1-34d71e0b0dbb';

// print env variables
//console.log(process.env)

const transmision_add_torrent = async (suggestion, torrent) => {
  // this function will add a torrent to the transmission server
  // it will return true if the torrent was added successfully
  // send the request to add a toreent to the transmission server
  let res = await axios.post(`${server}/yify/add`, {
    movie_id: suggestion.id,
    quality: torrent,
    token: token,
  })
  if (res.status === 'ok')
    return true;
  else
    return false;
}

const query_torrents = async () =>
  // this function will query the transmission server for the list of torrents
  // it will return the list of torrents
  await axios
    .get(`${server}/torrents`, {
      token: token,
    })
    .then(res => res.data)
    .catch(err => console.log(err))


const query_disk = async () =>
  // this function will query the transmission server the disk space left
  await axios
    .get(`${server}/disk`, {
      token: token,
    })
    .then(res => res.data)
    .catch(err => console.log(err))

export { transmision_add_torrent, query_torrents, query_disk } 