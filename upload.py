import requests

url = 'http://localhost:80/photo/'
files = {'image': open('./cache/imgs/phd_001.gif', 'rb')}
ret = requests.post(url, files=files)
print ret.content
