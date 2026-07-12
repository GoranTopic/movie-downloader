import axios from 'axios';

let server = process.env.REACT_APP_API_URL || 'http://localhost:3001'

// key used to store the session in the browser
const STORAGE_KEY = 'movie-downloader-user';

// set the user-token header for all future requests
const set_user_header = (token) => {
    if (token) axios.defaults.headers.common['user-token'] = token;
    else delete axios.defaults.headers.common['user-token'];
}

// read the stored session (if any) and set the header
const get_stored_user = () => {
    try {
        const user = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (user?.token) {
            set_user_header(user.token);
            return user;
        }
    } catch { /* corrupted storage, ignore */ }
    return null;
}

// store the session and set the header
const store_user = (user) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    set_user_header(user.token);
}

// create a new account; leave username empty to get a random name.
// no session is created yet — the user must verify their email first
const signup = async (username, password, email) => {
    const res = await axios.post(`${server}/auth/signup`, { username, password, email });
    if (res.data.error) throw new Error(res.data.error);
    return res.data; // { status: 'verification-sent', username, email }
}

// get a guest identity with a random name (no password needed)
const guest_login = async () => {
    const res = await axios.post(`${server}/auth/guest`);
    if (res.data.error) throw new Error(res.data.error);
    store_user(res.data);
    return res.data;
}

// log an existing user in
const login = async (username, password) => {
    const res = await axios.post(`${server}/auth/login`, { username, password });
    if (res.data.error) throw new Error(res.data.error);
    store_user(res.data);
    return res.data;
}

// check with the server that the stored session is still valid
const check_session = async () => {
    const user = get_stored_user();
    if (!user) return null;
    try {
        const res = await axios.get(`${server}/auth/me`);
        if (res.data.username) return user;
    } catch { /* server unreachable, keep the stored session */
        return user;
    }
    // session expired or user was removed
    logout();
    return null;
}

// forget the session
const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    set_user_header(null);
}

export { signup, login, guest_login, logout, get_stored_user, check_session };
