import asyncio
import websockets

async def listen():
    url = 'ws://localhost:8000/ws/events'
    try:
        async with websockets.connect(url) as ws:
            print('connected to', url)
            # listen for up to 12 seconds
            async def reader():
                try:
                    async for msg in ws:
                        print('MSG:', msg)
                except Exception as e:
                    print('reader error', e)
            reader_task = asyncio.create_task(reader())
            await asyncio.sleep(12)
            reader_task.cancel()
    except Exception as e:
        print('connection failed:', e)

if __name__ == '__main__':
    asyncio.run(listen())
