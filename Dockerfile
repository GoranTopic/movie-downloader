FROM node:24

# Install transmission-daemon and required packages
RUN apt-get update && apt-get install -y \
    transmission-daemon \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Set up working directory
WORKDIR /app

# Copy application code
COPY frontend/ ./frontend/
COPY backend/ ./backend/

# Install dependencies for both frontend and backend
RUN cd frontend && npm install
RUN cd backend && npm install

# Build frontend
RUN cd frontend && npm run serve

# Configure Transmission
RUN mkdir -p /etc/transmission-daemon/
COPY <<EOF /etc/transmission-daemon/settings.json
{
    "download-dir": "/downloads",
    "incomplete-dir": "/downloads/incomplete",
    "incomplete-dir-enabled": true,
    "rpc-authentication-required": false,
    "rpc-bind-address": "0.0.0.0",
    "rpc-port": 9091,
    "rpc-whitelist-enabled": false
}
EOF

# Create downloads directory
RUN mkdir -p /downloads/incomplete && chmod -R 777 /downloads

# Configure supervisord
COPY <<EOF /etc/supervisor/conf.d/services.conf
[supervisord]
nodaemon=true

[program:transmission]
command=/usr/bin/transmission-daemon -f --log-error
autostart=true
autorestart=true
stderr_logfile=/var/log/transmission.err.log
stdout_logfile=/var/log/transmission.out.log

[program:backend]
command=node /app/backend/src/server.js
directory=/app/backend
autostart=true
autorestart=true
stderr_logfile=/var/log/backend.err.log
stdout_logfile=/var/log/backend.out.log

# Create an environment file for the frontend
COPY <<EOF /app/frontend/.env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_CORS_PROXY=http://localhost:3001/proxy
REACT_APP_CORS_TOKEN=123456789
EOF

# Expose ports
EXPOSE 80 9091 3001

# Start services using supervisord
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]