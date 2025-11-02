#!/bin/sh

if [ -e "/run/secrets/app.secret" ]; then
  set -a;
  . /run/secrets/app.secret
  set +a
fi

if [ -e "/app.env" ]; then
  set -a;
  . /app.env
  set +a
fi

envsubst < /usr/share/nginx/html/config.template.js > /usr/share/nginx/html/config.js

# Start nginx
exec nginx -g 'daemon off;'
