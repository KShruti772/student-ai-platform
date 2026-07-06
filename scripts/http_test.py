import urllib.request
try:
    print('fetching openapi...')
    data = urllib.request.urlopen('http://127.0.0.1:8000/openapi.json').read()
    print('len', len(data))
except Exception as e:
    print('http err', e)
