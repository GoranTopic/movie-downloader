import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
// load the environment variables
dotenv.config();

// where the users are stored on disk
const USERS_PATH = process.env.USERS_PATH
    ? path.resolve(process.env.USERS_PATH)
    : path.join(process.cwd(), 'data', 'users.json');

// secret used to sign the session tokens
const AUTH_SECRET = process.env.AUTH_SECRET || process.env.TOKEN || 'change-me-secret';

// how long a session token is valid (30 days)
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// word lists used to build random usernames
const adjectives = [
    'Sneaky', 'Happy', 'Brave', 'Silent', 'Cosmic', 'Turbo', 'Fuzzy', 'Mighty',
    'Lazy', 'Wild', 'Golden', 'Shadow', 'Electric', 'Crimson', 'Frozen', 'Lucky'
];
const animals = [
    'Panda', 'Falcon', 'Otter', 'Tiger', 'Penguin', 'Fox', 'Wolf', 'Koala',
    'Raccoon', 'Dolphin', 'Hawk', 'Llama', 'Badger', 'Moose', 'Gecko', 'Owl'
];

// load the users from disk, or start with an empty list
let users = [];
try {
    users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
} catch {
    users = [];
}

// save the users to disk
const save_users = () => {
    fs.mkdirSync(path.dirname(USERS_PATH), { recursive: true });
    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
}

// hash a password with scrypt and a random salt
const hash_password = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

// check a password against a stored salt:hash
const verify_password = (password, stored) => {
    const [salt, hash] = stored.split(':');
    const candidate = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
}

// sign a payload so tokens can't be forged
const sign = (payload) =>
    crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex');

// create a session token for a username: base64(username).expiry.signature
const create_user_token = (username) => {
    const expiry = Date.now() + TOKEN_TTL_MS;
    const payload = `${Buffer.from(username).toString('base64url')}.${expiry}`;
    return `${payload}.${sign(payload)}`;
}

// verify a session token, returns the user or null
const verify_user_token = (token) => {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [name64, expiry, signature] = parts;
    const payload = `${name64}.${expiry}`;
    // check the signature
    const expected = sign(payload);
    if (signature.length !== expected.length ||
        !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)))
        return null;
    // check the expiry
    if (Date.now() > parseInt(expiry)) return null;
    // check the user still exists
    const username = Buffer.from(name64, 'base64url').toString('utf8');
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    return user ? { username: user.username, guest: !!user.guest } : null;
}

// generate a random username that is not taken yet
const random_username = () => {
    for (let i = 0; i < 100; i++) {
        const name = adjectives[Math.floor(Math.random() * adjectives.length)]
            + animals[Math.floor(Math.random() * animals.length)]
            + Math.floor(Math.random() * 100);
        if (!users.find(u => u.username.toLowerCase() === name.toLowerCase()))
            return name;
    }
    // practically unreachable, but make sure we always return something unique
    return `User${Date.now()}`;
}

// create a new user; if no username is given a random one is assigned.
// the account stays unverified until the emailed link is clicked,
// so people can't create endless accounts without a real inbox
const signup = (username, password, email) => {
    if (!password || password.length < 4)
        return { error: 'password must be at least 4 characters' };
    email = (email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return { error: 'a valid email address is required' };
    // one account per email address
    if (users.find(u => u.email && u.email.toLowerCase() === email))
        return { error: 'an account with this email already exists' };
    username = (username || '').trim();
    if (!username)
        username = random_username();
    if (username.length > 30 || !/^[a-zA-Z0-9_\- ]+$/.test(username))
        return { error: 'username can only contain letters, numbers, spaces, - and _' };
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase()))
        return { error: 'username already taken' };
    const verifyToken = crypto.randomBytes(24).toString('hex');
    users.push({
        username,
        email,
        password: hash_password(password),
        verified: false,
        verifyToken,
        createdAt: Date.now()
    });
    save_users();
    return { username, email, verifyToken };
}

// mark an account as verified using the token from the email link
const verify_email = (verifyToken) => {
    const user = users.find(u => u.verifyToken && u.verifyToken === verifyToken);
    if (!user) return { error: 'invalid or already used verification link' };
    user.verified = true;
    delete user.verifyToken;
    save_users();
    return { username: user.username };
}

// log an existing user in
const login = (username, password) => {
    username = (username || '').trim();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    // guests have no password, so they can never log in this way
    if (!user || !user.password || !password || !verify_password(password, user.password))
        return { error: 'invalid username or password' };
    // accounts created before email verification existed have no
    // `verified` field and stay usable; new ones must verify first
    if (user.verified === false)
        return { error: 'please verify your email first — check your inbox' };
    return { username: user.username, token: create_user_token(user.username) };
}

// create a guest user with a random name and no password,
// so visitors are identified without having to sign up
const create_guest = () => {
    const username = random_username();
    users.push({ username, guest: true, createdAt: Date.now() });
    save_users();
    return { username, guest: true, token: create_user_token(username) };
}

export { signup, login, create_guest, verify_email, verify_user_token };
