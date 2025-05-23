#!/bin/sh

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

