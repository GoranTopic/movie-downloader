FROM alpine:3

RUN apk add --no-cache transmission-daemon

COPY settings.json /etc/transmission/settings.json

# seed the config on first start (cp -n keeps changes made later),
# then run the daemon in the foreground
CMD ["sh", "-c", "mkdir -p /config && cp -n /etc/transmission/settings.json /config/settings.json && exec transmission-daemon -f -g /config --log-level=error"]
