import asyncio
import websockets

async def listen():
    candidates = ['ws://127.0.0.1:8000/ws/events', 'ws://localhost:8000/ws/events', 'ws://[::1]:8000/ws/events']
    url = None
    for c in candidates:
        url = c
        try:
            async with websockets.connect(url) as ws:
                print('connected to', url)
                for _ in range(3):
                    try:
                        msg = await asyncio.wait_for(ws.recv(), timeout=6)
                        print('MSG:', msg)
                    except asyncio.TimeoutError:
                        print('timeout waiting for msg')
                await ws.close()
                return
        except Exception as e:
            print('failed', url, repr(e))
    print('all connection attempts failed')

if __name__ == '__main__':
    asyncio.run(listen())
