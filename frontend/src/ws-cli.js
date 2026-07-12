import { get_stored_user } from './auth-cli';

let server = process.env.REACT_APP_API_URL || 'http://localhost:3001'

// super secret token, don't share =P
let token = process.env.REACT_APP_TOKEN || '123456789';

const RECONNECT_MS = 3000;

let socket = null;
let reconnectTimer = null;
let shouldRun = false;
const listeners = new Set();

// tell every subscriber about a message
const emit = (message) => listeners.forEach(listener => listener(message));

// whether the live connection is currently usable
const socket_connected = () =>
    !!socket && socket.readyState === WebSocket.OPEN;

// open (or re-open) the websocket, authenticated as the current user
const connect_socket = () => {
    shouldRun = true;
    clearTimeout(reconnectTimer);
    // drop any previous connection first
    if (socket) {
        socket.onclose = null;
        socket.close();
        socket = null;
    }
    const user = get_stored_user();
    const wsUrl = server.replace(/^http/, 'ws')
        + `/ws?token=${encodeURIComponent(token)}&user-token=${encodeURIComponent(user?.token || '')}`;
    socket = new WebSocket(wsUrl);
    socket.onopen = () => emit({ type: 'connected' });
    socket.onmessage = (event) => {
        try {
            emit(JSON.parse(event.data));
        } catch (err) {
            console.error('Bad websocket message:', err);
        }
    };
    socket.onclose = () => {
        emit({ type: 'disconnected' });
        // keep trying to get the live connection back
        if (shouldRun) reconnectTimer = setTimeout(connect_socket, RECONNECT_MS);
    };
    socket.onerror = () => socket && socket.close();
}

// stop the connection for good (component unmount)
const disconnect_socket = () => {
    shouldRun = false;
    clearTimeout(reconnectTimer);
    if (socket) {
        socket.onclose = null;
        socket.close();
        socket = null;
    }
}

// listen for websocket messages; returns an unsubscribe function
const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

// send a message to the server (dropped silently while disconnected)
const send_message = (message) => {
    if (socket_connected()) socket.send(JSON.stringify(message));
}

export { connect_socket, disconnect_socket, subscribe, send_message, socket_connected };
