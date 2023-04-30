FROM node:20-buster
MAINTAINER Mingyang Wang <miw092@eng.uced.edu>

# Install necessary dependencies and tools
RUN apt-get update && apt-get install -y redis-server


# Create app directory
RUN mkdir -p /root/app
WORKDIR /root/app

# Install app dependences
COPY package.json /root/app
RUN npm install

# Bundle app source
COPY server.js /root/app
COPY start_service.sh /root/app
COPY views /root/app/views

# Bind to local port 80
EXPOSE 80

# Start the service
CMD ["/bin/bash", "start_service.sh"]
