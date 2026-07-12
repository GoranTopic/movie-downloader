# Movie Downloader

A full-stack application that helps you search for and download movies using torrents. The project consists of a React-based frontend and a Node.js backend that work together to provide a seamless movie downloading experience.

## Running with Docker

Each service has its own container: `frontend` (nginx serving the React build), `backend` (Node API + WebSocket), `transmission` (torrent daemon) and `mailserver` (delivers signup verification emails).

```bash
docker compose up -d --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Mail UI (see the verification emails): http://localhost:8025

Set `TOKEN`, `AUTH_SECRET` and `PUBLIC_API_URL` in a `.env` file next to `docker-compose.yml` for real deployments. The bundled mailserver (Mailpit) keeps emails in a local inbox at :8025; to deliver to real mailboxes, point the backend's `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS` at a real SMTP relay instead.

## Project Structure

```
movie-downloader/
├── frontend/           # React frontend application
│   ├── src/           # Source files
│   ├── public/        # Static files
│   └── build/         # Production build
├── backend/           # Node.js backend server
│   └── src/           # Source files
└── README.md          # Project documentation
```

## Features

### Frontend
- Modern, responsive UI built with React and Material-UI
- Real-time search functionality
- Movie details display
- Download progress tracking
- Transmission daemon management interface

### Backend
- RESTful API for movie search and management
- Integration with Transmission for torrent handling
- Disk space monitoring
- Secure file handling
- CORS support for frontend communication

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Transmission daemon
- Internet connection

### Installing Transmission Daemon

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install transmission-daemon
```

#### Fedora:
```bash
sudo dnf install transmission-daemon
```

#### Arch Linux:
```bash
sudo pacman -S transmission-cli
```

After installation, you'll need to configure Transmission:

1. Stop the daemon:
```bash
sudo systemctl stop transmission-daemon
```

2. Edit the settings file:
```bash
sudo nano /etc/transmission-daemon/settings.json
```

3. Update these settings:
```json
{
    "rpc-enabled": true,
    "rpc-bind-address": "0.0.0.0",
    "rpc-port": 9091,
    "rpc-whitelist": "127.0.0.1,localhost",
    "rpc-authentication-required": false
}
```

4. Start the daemon:
```bash
sudo systemctl start transmission-daemon
```

5. Enable it to start on boot:
```bash
sudo systemctl enable transmission-daemon
```

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory with the following variables:
```
PORT=3001
TRANSMISSION_HOST=localhost
TRANSMISSION_PORT=9091
TRANSMISSION_USERNAME=your_username
TRANSMISSION_PASSWORD=your_password
```

4. Start the backend server:
```bash
npm start
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory:
```
REACT_APP_API_URL=http://localhost:3001
```

4. Start the development server:
```bash
npm start
```

## Technologies Used

### Frontend
- React.js - UI framework
- Material-UI - Component library
- Axios - HTTP client
- Emotion - CSS-in-JS styling
- React Scripts - Development tools

### Backend
- Express.js - Web framework
- Transmission - Torrent client integration
- Axios - HTTP client
- CORS - Cross-origin resource sharing
- Check-disk-space - Disk space monitoring
- Nodemon - Development server

## Development

### Running the Project

1. Start the backend server:
```bash
cd backend
npm start
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

3. Access the application at `http://localhost:3000`

### Building for Production

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. The production build will be available in the `frontend/build` directory

## License

ISC License

## Author

Goran Topic 