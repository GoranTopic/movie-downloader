# ---- build stage ----
FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY public ./public
COPY src ./src

# the API url and token get baked into the static bundle
ARG REACT_APP_API_URL=http://localhost:3001
ARG REACT_APP_TOKEN=123456789
ENV REACT_APP_API_URL=$REACT_APP_API_URL \
    REACT_APP_TOKEN=$REACT_APP_TOKEN \
    PUBLIC_URL=/

RUN npm run build

# ---- serve stage ----
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
