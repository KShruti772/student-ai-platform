import asyncio
import websockets

async def listen():
    url = 'ws://127.0.0.1:8001/ws/events'
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
    except Exception as e:
        print('connection failed:', repr(e))

if __name__ == '__main__':
    asyncio.run(listen())
