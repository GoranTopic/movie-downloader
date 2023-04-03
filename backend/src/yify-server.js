import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

var endpoint = process.env.YIFY || 'https://yts.lt/api/v2/';

const get_torrent = async (movie_id, quality) =>
  /* with the given movie_id and quality
  this function will query the yify api for the torrent
  return the torrent object */
  await axios
    .get(`${endpoint}/movie_details.json`, {
      params: {
        movie_id: movie_id,
      },
    })
    .then(response => {
      let movie = response.data.data.movie;
      let torrent = movie.torrents.filter(
        t => t.hash === quality.hash
      )[0]
      return torrent
    })
    .catch(e => console.error(e))

export { get_torrent }
