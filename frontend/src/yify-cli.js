import axios from 'axios';

// yify api endpoint
var endpoint = process.env.REACT_APP_URL || 'http://localhost:3001'

// super secret token, don't share =P 
var token = process.env.REACT_APP_TOKEN || '123456789';

const query_movie_suggestions = async key => {
    try {
        const { data } = await axios
            .get(`${endpoint}/search/${key}`, {
                headers: { token } // token for the cors proxy
            })
        if (data?.status === 'ok')
            if (data.movies) {
                return data.movies;
            } 
        return []
    } catch (err) {
        throw err;
    }
}


export { query_movie_suggestions  }
