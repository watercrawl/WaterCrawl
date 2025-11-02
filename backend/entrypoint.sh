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

if [ "$1" = "gunicorn" ]; then
  shift
  python3 manage.py migrate && python3 manage.py collectstatic --noinput

  gunicorn $@
elif [ "$1" = "celery" ]; then
	shift
	celery $@
elif [ "$1" = "bash" ]; then
	bash
fi

exec "$@"
