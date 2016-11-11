import requests

url = 'http://localhost:80/photo/1/'  # webfront
ret = requests.delete(url)
print ret.content
