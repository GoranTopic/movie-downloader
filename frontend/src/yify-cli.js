import axios from 'axios';
//import doenv from 'dotenv';
//doenv.config();

// yify api endpoint
//var endpoint = process.env.YIFY || 'https://yts.lt/api/v2/';
var endpoint = 'https://yts.lt/api/v2/';

// cors proxy
//var cors_proxy = process.env.CORS_PROXY || 'http://147.182.241.239:4236';
var cors_proxy = 'http://147.182.241.239:4236';

// super secret token, don't share =P 
//var token = process.env.CORS_TOKEN || '5df54d27-26d0-43ce-aef1-34d71e0b0dbb';
var token = '5df54d27-26d0-43ce-aef1-34d71e0b0dbb';

// print env variables
//console.log(process.env)

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
