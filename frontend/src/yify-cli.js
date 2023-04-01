import axios from 'axios';

const get_torrent = async (movie_id, quality) =>
  await axios
    .get(`${endpoint}/list_movies.json`, {
      params: {
        movie_id: movie_id,
        with_images: true,
      },
    })
    .then(response => {
      let movie = response.data.movie;
      let torrent = movie.torrents.filter(
        t => t.quality === quality
      )[0]
      return torrent
    })
    .catch(e => console.error(e))

export { get_torrent }
