FROM node:7.0.0
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

# Bind to local port 8080
EXPOSE 8080

# Start the service
CMD ["/bin/bash", "start_service.sh"] 

	# Sadly this instruction not working....
	# CMD '/usr/bin/redis-server && npm start'