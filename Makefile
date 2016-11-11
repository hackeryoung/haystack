default:
	echo aha

stop:
	docker stop h_directory h_proxy h_webfront h_cache h_storage1 h_storage2

resume:
	docker start h_directory
	sleep 5
	docker start h_proxy h_webfront h_cache h_storage1 h_storage2

clean:
	# Containers 
	docker rm h_directory h_proxy h_webfront h_cache h_storage1 h_storage2
	# Network
	docker network rm haystack_network
	# Remove dangling volumes
	docker volume rm `docker volume ls -q -f dangling=true`

scr:
	# Stop
	docker stop h_directory h_proxy h_webfront h_cache h_storage1 h_storage2
	# Clean
	docker rm h_directory h_proxy h_webfront h_cache h_storage1 h_storage2
	docker network rm haystack_network
	docker volume rm `docker volume ls -q -f dangling=true`
	# Run
	sh run.sh


