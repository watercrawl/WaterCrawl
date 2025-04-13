#!/bin/sh
set -e

# Replace environment variables in the Nginx configuration template
envsubst '${MINIO_PRIVATE_BUCKET} ${MINIO_PUBLIC_BUCKET}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start Nginx
exec nginx -g 'daemon off;'
