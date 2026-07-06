import socket

req = (
    "GET /ws/events HTTP/1.1\r\n"
    "Host: 127.0.0.1:8000\r\n"
    "Upgrade: websocket\r\n"
    "Connection: Upgrade\r\n"
    "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==\r\n"
    "Sec-WebSocket-Version: 13\r\n\r\n"
)

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
try:
    s.settimeout(5)
    s.connect(('127.0.0.1', 8000))
    s.send(req.encode())
    data = s.recv(4096)
    print('RESPONSE:', data.decode(errors='replace'))
except Exception as e:
    print('ERR', e)
finally:
    s.close()
