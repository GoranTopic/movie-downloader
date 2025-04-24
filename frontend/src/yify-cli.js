import axios from 'axios';

// yify api endpoint
var endpoint = process.env.REACT_APP_YIFY || 'https://yts.lt/api/v2/';

// cors proxy
var cors_proxy = process.env.REACT_APP_CORS_PROXY || 'http://localhost:3001/proxy';

// super secret token, don't share =P 
var token = process.env.REACT_APP_CORS_TOKEN || '123456789';

const query_movie_suggestions = async key => {
  console.log("querying movie suggestions:", key)
  try {
    const { data } = await axios
      .get(`${cors_proxy}/${endpoint}/list_movies.json`, {
        params: { 
          query_term: key,
          limit: 50,
         },
        headers: { token } // token for the cors proxy
      })
    console.log("got movie suggestions:", data)
    if (data.status === 'ok')
      if (data.data.movies) {
        console.log("got movie suggestions:", data.data.movies)
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