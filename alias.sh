function update_webfront() {
    # assume alredy running
    docker stop h_webfront
    docker cp webfront/server.js h_webfront:/root/app/
    docker start h_webfront
}

# docker logs h_webfront  # check container log 
