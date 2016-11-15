import requests

url = 'http://localhost:80/photo/97b72fb0-a84a-11e6-bf37-6d2c86545d91/'  # webfront
ret = requests.delete(url)
print ret.content
