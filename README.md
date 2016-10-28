# Facebook Haystack Implementation

## Getting Started
Be sure to install Docker 1.12.1 on the machine that runs this cluster.

```
sh run.sh
```

To stop and remove all involved containers, and to delete all dangling Docker volumes

```
sh clean.sh
```

[Live Demo](http://playground.hyoung.me/)

## Components Description
### Reverse Proxy Server
Based on Nginx

### Front-end Web Server
Based on Node.js

### Haystack Directory
Based on Cassandra. Currently contains a simple table `photo` in keyspace `photo` `{pid INT PRIMARY KEY, pindex VARSTR}`

### Haystack Cache
Based on Redis & Node.js


