import axios from 'axios';

// Get the server URL from environment variable or use default
const serverUrl = process.env.REACT_APP_TRANSMISSION_SERVER || 'http://localhost:3001';

// Set timeout to 5 minutes (300000 ms)
const SUBTITLE_REQUEST_TIMEOUT = 5 * 60 * 1000;

/**
 * Fetches subtitles for a movie using either the movie ID or IMDB code
 * @param {string} movieId - The movie ID
 * @param {string} [imdbCode] - Optional IMDB code for the movie
 * @returns {Promise<Array>} Array of subtitle files
 */
export const getSubs = async (torrentId, imdbCode) => {
    // First try to get subtitles using IMDB code if available
    try {
        console.log('Fetching subtitles for torrent:', torrentId, 'with IMDB code:', imdbCode);
        const response = await axios.get(`${serverUrl}/yify/subtitles/${torrentId}/${imdbCode}`, {
            timeout: SUBTITLE_REQUEST_TIMEOUT
        });
        if (response.data && response.data.torrent)

            return response.data.torrent
        else
            throw new Error('No subtitles found');
        
    } catch (error) {
        console.warn('Failed to fetch subtitles using IMDB code:', error);
    }
}; 