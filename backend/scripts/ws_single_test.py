import asyncio
import websockets

async def main():
    try:
        async with websockets.connect('ws://127.0.0.1:8000/ws/events') as ws:
            print('connected to events')
            # receive a message or two
            for _ in range(3):
                msg = await ws.recv()
                print('msg:', msg)
    except Exception as e:
        print('error:', e)

if __name__ == '__main__':
    asyncio.run(main())
