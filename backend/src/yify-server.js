import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

var endpoint = process.env.YIFY || 'https://yts.lt/api/v2/';

const query_movie = async movie_id =>
  /* with the given movie_id and quality
  this function will query the yify api for the torrent
  return the torrent object */
  await axios
    .get(`${endpoint}/movie_details.json`, {
      params: {
        movie_id: movie_id,
      },
    })
    // unpack the response
    .then(response => response.data.data.movie)
    .catch(e => console.error(e))

const get_torrent = (movie, quality) =>
  /* with the given movie and quality 
  this function will select the torrent matching the quality
  */
  movie.torrents.filter( t => 
    t.hash === quality.hash
  )[0]

export { get_torrent, query_movie }
