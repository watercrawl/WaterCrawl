# WaterCrawl

WaterCrawl is a web application that uses Python, Django, Scrapy, and Celery to crawl web pages and extract relevant data.

## Features

- Crawl web pages using Scrapy
- Extract data from crawled pages using Scrapy
- Store extracted data in a database using Django
- Use Celery to run tasks asynchronously

## Installation

- Clone the repository
- Install the dependencies using pip: `pip install -r requirements.txt`
- Run the database migrations: `python manage.py migrate`
- Run the server: `python manage.py runserver`

## Configuration

- Set the `SCRAPY_SETTINGS_MODULE` environment variable to the path of the Scrapy settings module
- Set the `CELERY_BROKER_URL` environment variable to the URL of the Celery broker
- Set the `CELERY_RESULT_BACKEND` environment variable to the URL of the Celery result backend

## Usage

- Create a new crawl configuration using the Django admin interface
- Run the crawl using the Django admin interface
- View the extracted data in the Django admin interface

## Requirements

- Python 3.11 or higher
- Django 5.1.4 or higher
- Scrapy 2.12.0 or higher
- Celery 5.4.0 or higher
- Redis 6.2.6 or higher (for Celery broker and result backend)