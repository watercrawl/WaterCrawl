FROM python:3.11

ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
        nginx \
        build-essential \
        wget \
        git \
        default-libmysqlclient-dev && \
        rm -rf /var/lib/apt/lists/* && \
        mkdir -p /var/www

WORKDIR /var/www

ADD requirements.txt /var/www/requirements.txt

RUN pip install -r requirements.txt

ADD . /var/www

RUN chmod +x /var/www/entrypoint.sh && mkdir .celery/

#RUN cd /var/www/ && python3 manage.py collectstatics
ENTRYPOINT ["/var/www/entrypoint.sh"]

