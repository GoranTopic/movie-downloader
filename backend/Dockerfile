FROM node:24-alpine

WORKDIR /app

# install dependencies first so they cache between builds
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "src/server.js"]
