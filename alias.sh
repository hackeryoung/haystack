WEBFRONT_CONTAINER=h_webfront
CACHE_CONTAINER=h_cache
STORAGE_CONTAINER=h_storage
STORAGE_IP=172.20.0.6
STORAGE_SERVER_PORT=8081
STORAGE_IMAGE=hyoung/haystack_storage
STORAGE_INTERNAL_PORT=8080
LOCAL_STORAGE_DIR=$(pwd)'/storage'
NETWORK=haystack_network
WEBFRONT_IP=172.20.0.3
WEBFRONT_IMAGE=hyoung/haystack_webfront
LOCAL_WEBFRONT_DIR=$(pwd)'/webfront'

function update_webfront() {
  # assume alredy running
  docker stop $WEBFRONT_CONTAINER
  docker cp webfront/server.js $WEBFRONT_CONTAINER:/root/app/
  docker start $WEBFRONT_CONTAINER
}

function update_cache() {
  docker stop $CACHE_CONTAINER
  docker cp cache/server.js $CACHE_CONTAINER:/root/app
  docker start $CACHE_CONTAINER
}

function restart_webfront() {
  # after changing docker file
  docker stop $WEBFRONT_CONTAINER
  docker rm $WEBFRONT_CONTAINER
  docker build -t $WEBFRONT_IMAGE $LOCAL_WEBFRONT_DIR
  docker run -itd \
    --name $WEBFRONT_CONTAINER \
    --network $NETWORK \
    --ip $WEBFRONT_IP \
    $WEBFRONT_IMAGE
}

function restart_storage() {
  docker stop $STORAGE_CONTAINER
  docker rm $STORAGE_CONTAINER
  docker build -t $STORAGE_IMAGE $LOCAL_STORAGE_DIR
  docker run -itd \
  --name $STORAGE_CONTAINER \
  --network $NETWORK \
  --ip $STORAGE_IP \
  -p $STORAGE_SERVER_PORT:$STORAGE_INTERNAL_PORT \
  $STORAGE_IMAGE
}

# docker logs h_webfront  # check container log
