import axios from 'axios';

// yify api endpoint
var endpoint = process.env.REACT_APP_YIFY || 'https://yts.lt/api/v2/';

// cors proxy
var cors_proxy = process.env.REACT_APP_CORS_PROXY || 'http://loacalhost:4236';

// super secret token, don't share =P 
var token = process.env.REACT_APP_CORS_TOKEN || '1234567890';

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


export { query_movie_suggestions  }
