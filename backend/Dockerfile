FROM python:3.13 AS base

ENV PYTHONUNBUFFERED=1
ARG APP_VERSION=unknown

# Install Poetry
ENV POETRY_VERSION=2.0.1

RUN pip install --no-cache-dir poetry==${POETRY_VERSION}

# Configure Poetry
ENV POETRY_CACHE_DIR=/tmp/poetry_cache
ENV POETRY_NO_INTERACTION=1
ENV POETRY_VIRTUALENVS_IN_PROJECT=true
ENV POETRY_VIRTUALENVS_CREATE=true
ENV POETRY_REQUESTS_TIMEOUT=15

FROM base AS builder

RUN apt-get update && apt-get install -y \
        nginx \
        build-essential \
        wget \
        git \
        gettext \
        default-libmysqlclient-dev && \
        rm -rf /var/lib/apt/lists/* && \
        mkdir -p /var/www

WORKDIR /var/www

COPY pyproject.toml poetry.lock ./

RUN poetry install --sync --no-cache --no-root

FROM builder AS runtime

WORKDIR /var/www

ADD . /var/www


RUN chmod +x /var/www/entrypoint.sh && mkdir /var/www/.celery/ && echo ${APP_VERSION} > /var/www/VERSION && \
    poetry run django-admin compilemessages

ENV PATH="/var/www/.venv/bin:${PATH}"

ENTRYPOINT ["/var/www/entrypoint.sh"]

