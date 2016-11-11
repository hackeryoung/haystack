import requests

url = 'http://localhost:80/photo/'  # webfront
# url = 'http://localhost:8081/1/10/gif/'  # storage
files = {'image': open('./cache/imgs/phd_001.gif', 'rb')}
ret = requests.post(url, files=files)
print ret.content
