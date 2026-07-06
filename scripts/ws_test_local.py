import asyncio
import websockets

async def listen():
    url = 'ws://127.0.0.1:8000/ws/events'
    try:
        async with websockets.connect(url) as ws:
            print('connected to', url)
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=5)
                print('MSG:', msg)
            except asyncio.TimeoutError:
                print('no messages in 5s')
    except Exception as e:
        print('connection failed:', e)

if __name__ == '__main__':
    asyncio.run(listen())
