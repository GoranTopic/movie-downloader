import axios from 'axios';

let server = process.env.REACT_APP_TRANSMISSION_SERVER || 'http://localhost:4237';

// super secret token, don't share =P 
let token = process.env.REACT_APP_TRANSMISSION_TOKEN || '123456789';

// set headers to axios 
axios.defaults.headers.common['token'] = token;

const transmision_add_torrent = async (suggestion, torrent) => {
  // this function will add a torrent to the transmission server
  // it will return true if the torrent was added successfully
  // send the request to add a toreent to the transmission server
  let res = await axios.post(`${server}/yify/add`, {
    movie_id: suggestion.id,
    quality: torrent,
  })
  if (res.data.status === 'ok')
    return res.data.id;
  else
    return false;
}

const query_status = async () =>
  // this function will query the transmission server for the list of torrents
  // and the memory usage
  await axios
    .get(`${server}/status`)
    .then(res => res.data)
    .catch(err => console.log(err))

export { transmision_add_torrent, query_status } 