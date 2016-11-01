#########################################################################
# Config vars
#########################################################################
# Set to the names of the Docker images you want to use
PROXY_IMAGE=hyoung/haystack_proxy
WEBFRONT_IMAGE=hyoung/haystack_webfront
DIRECTORY_IMAGE=hyoung/haystack_directory
CACHE_IMAGE=hyoung/haystack_cache
# DATA_IMAGE=hyoung/haystack_data

# Set the names of the Docker containers for corresponding images
PROXY_CONTAINER=h_proxy
WEBFRONT_CONTAINER=h_webfront
DIRECTORY_CONTAINER=h_directory
CACHE_CONTAINER=h_cache
# DATA_CONTAINER=h_data

# Set the name of the bridge network
NETWORK=haystack_network

# Set the local directories to the components
LOCAL_PROXY_DIR=$(pwd)'/proxy'
LOCAL_WEBFRONT_DIR=$(pwd)'/webfront'
LOCAL_DIRECTORY_DIR=$(pwd)'/directory'
LOCAL_CACHE_DIR=$(pwd)'/cache'
# LOCAL_DATA_DIR=$(pwd)'/data'

# Set the ip4 address for each component
SUBNET=172.20.0.0/16
GATEWAY=172.20.0.1
PROXY_IP=172.20.0.2
WEBFRONT_IP=172.20.0.3
DIRECTORY_IP=172.20.0.4
CACHE_IP=172.20.0.5


# Set the image directories
# WORK_DIR='/root/network'
# DATA='/data/string.txt'

# Set the port
PROXY_SERVER_PORT=80
STORAGE_SERVER_PORT=8080 # cache server



#########################################################################
# Build images:
#########################################################################
echo "-----------------------------------------------------------"
echo "Building images"
echo "-----------------------------------------------------------"
# Build the Haystack Images
docker build -t $PROXY_IMAGE $LOCAL_PROXY_DIR
docker build -t $WEBFRONT_IMAGE $LOCAL_WEBFRONT_DIR
docker build -t $DIRECTORY_IMAGE $LOCAL_DIRECTORY_DIR
docker build -t $CACHE_IMAGE $LOCAL_CACHE_DIR
# Build the data volume container Image
# docker build -t $DATA_IMAGE $LOCAL_DATA_DIR



#########################################################################
# Start running Haystack prototype
#########################################################################
echo "-----------------------------------------------------------"
echo "Start running Haystack prototype"
echo "-----------------------------------------------------------"

# Create a bridge network for the components
docker network create \
  --driver bridge \
  --subnet $SUBNET \
  --gateway $GATEWAY \
  $NETWORK


# Create a data volumn container to simulate Distributed File System
# docker run -d --name $DATA_CONTAINER $DATA_IMAGE

# Create the Cache server container
# Currently use a Docker data volume to simulate Distributed File System
# indicated by flag '-v'
docker run -itd \
  --name $CACHE_CONTAINER \
  --network $NETWORK \
  --ip $CACHE_IP \
  -p $STORAGE_SERVER_PORT:$STORAGE_SERVER_PORT \
  -v $LOCAL_CACHE_DIR/imgs:/root/app/imgs \
  $CACHE_IMAGE


# Create the Directory server container
docker run -itd \
  --name $DIRECTORY_CONTAINER \
  --network $NETWORK \
  --ip $DIRECTORY_IP \
  $DIRECTORY_IMAGE


# Create a tiny table
sleep 30 # wait for Cassandra initialization
docker exec -d $DIRECTORY_CONTAINER cqlsh -f /root/init_table.txt


sleep 20 # wait for Cassandra table creation

# Create the web front server container
docker run -itd \
  --name $WEBFRONT_CONTAINER \
  --network $NETWORK \
  --ip $WEBFRONT_IP \
  $WEBFRONT_IMAGE


# Create the proxy container
docker run -itd \
  --name $PROXY_CONTAINER \
  --network $NETWORK \
  --ip $PROXY_IP \
  -p $PROXY_SERVER_PORT:$PROXY_SERVER_PORT \
  $PROXY_IMAGE
