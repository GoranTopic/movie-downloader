import { YifyService } from 'yify-api'

const yifyService = new YifyService();

const query_movies = async key => {
    const response = await yifyService.getMovies( {query_term : key} )
    if(response.status === 'ok')
        return  response.data.movies;
    throw new Error(response.status_message);
}

const get_torrent_url = async movie_id => 
        await yifyService
        .getMovie({
            movie_id: movie_id,
            with_images: true
        }).then( response => {
            let movie = response.data.movie;
            let torrent = movie.torrents.filter( 
                t => t.quality === '1080p'
            )[0]
            return torrent
        }).catch( e => console.error(e))

export { query_movies, get_torrent_url }
