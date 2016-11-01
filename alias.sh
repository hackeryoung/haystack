function stop() {
    docker stop h_directory h_proxy h_webfront h_cache
}

function update_webfront() {
    # assume alredy running
    docker stop h_webfront
    docker cp webfront/server.js h_webfront:/root/app/
    docker start h_webfront
}
