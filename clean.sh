docker stop h_directory h_proxy h_webfront h_cache
docker rm h_directory h_proxy h_webfront h_cache

# Remove dangling volumes
docker volume rm $(docker volume ls -q -f dangling=true)