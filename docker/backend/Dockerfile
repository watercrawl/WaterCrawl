ARG VERSION
# Use the official WaterCrawl image as the base image
FROM watercrawl/watercrawl:${VERSION:-v0.12.0}

# Set working directory
WORKDIR /var/www

# Copy the extra requirements file
COPY extra_requirements.txt /var/www/extra_requirements.txt

# Install any additional packages
RUN poetry run pip install -r /var/www/extra_requirements.txt

# The rest of the configuration is inherited from the base image
# The entrypoint and command should be defined in docker-compose.yml
