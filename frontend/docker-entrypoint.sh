#!/bin/sh
envsubst < /usr/share/nginx/html/config.template.js > /usr/share/nginx/html/config.js

# Replace the dummy URL with the actual API URL in all JS files
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|http://DUMMY_URL_FOR_REPLACE|${VITE_API_URL}|g" {} +

# Start nginx
exec nginx -g 'daemon off;'
