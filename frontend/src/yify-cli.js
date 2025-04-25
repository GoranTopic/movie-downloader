import axios from 'axios';

// yify api endpoint
var endpoint = process.env.REACT_APP_YIFY || 'https://yts.lt/api/v2/';

// cors proxy
var cors_proxy = process.env.API_PROXY || 'http://localhost:3001/teracsmoviedownloader/api/proxy/';

// super secret token, don't share =P 
var token = process.env.TOKEN || '123456789';

const query_movie_suggestions = async key => {
  try {
    const { data } = await axios
      .get(`${cors_proxy}/${endpoint}/list_movies.json`, {
        params: { 
          query_term: key,
          limit: 50,
         },
        headers: { token } // token for the cors proxy
      })
    if (data.status === 'ok')
      if (data.data.movies) {
        return data.data.movies;
      }
      else
        return []
    throw new Error(data.status_message);
  } catch (err) {
    throw err;
  }
}


export { query_movie_suggestions  }
