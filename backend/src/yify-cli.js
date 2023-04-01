import axios from 'axios';

// yify api endpoint
const endpoint = 'https://yts.lt/api/v2/';

// server address
let cors_proxy = 'http://147.182.241.239:4236';

// super secret token, don't share =P 
let token = '5df54d27-26d0-43ce-aef1-34d71e0b0dbb';

const query_movie_suggestions = async key => {
  console.log("querying movie suggestions:", key)
  try {
    const { data } = await axios
      .get(`${cors_proxy}/${endpoint}/list_movies.json`, {
        params: { query_term: key },
        headers: { token } // token for the cors proxy
      })
    if (data.status === 'ok')
      if (data.data.movies) {
        console.log("got movie suggestions:", data.data.movies)
        return data.data.movies;
      }
      else
        return []
    throw new Error(data.status_message);
  } catch (err) {
    console.error(err)
    throw new Error('Something went wrong');
  }
}

const get_torrent_url = async movie_id =>
  await axios
    .get(`${cors_proxy}/${endpoint}/list_movies.json`, {
      params: {
        movie_id: movie_id,
        with_images: true,
      },
      headers: { token } // token for the cors proxy
    })
    .then(response => {
      let movie = response.data.movie;
      let torrent = movie.torrents.filter(
        t => t.quality === '1080p'
      )[0]
      return torrent
    })
    .catch(e => console.error(e))

export { query_movie_suggestions, get_torrent_url }
