WEBFRONT_CONTAINER=h_webfront
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

# docker logs h_webfront  # check container log
