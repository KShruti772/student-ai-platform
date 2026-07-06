import asyncio
import json
import time
import statistics
import websockets

EVENTS_URL = 'ws://127.0.0.1:8000/ws/events'
SESSION_URL = 'ws://127.0.0.1:8000/ws/session/default'

NUM_EVENTS = 10
NUM_SESSIONS = 10
TEST_DURATION = 20.0  # seconds

class ClientStats:
    def __init__(self):
        self.connects = 0
        self.disconnects = 0
        self.reconnects = 0
        self.heartbeat_count = 0
        self.heartbeat_latencies = []
        self.errors = 0
        self.last_heartbeat = None

async def ws_client(url, stats: ClientStats, run_event: asyncio.Event, client_id: int):
    backoff = 0.1
    while not run_event.is_set():
        try:
            async with websockets.connect(url, ping_interval=None) as ws:
                stats.connects += 1
                backoff = 0.1
                # receive loop
                while not run_event.is_set():
                    try:
                        msg = await asyncio.wait_for(ws.recv(), timeout=5)
                    except asyncio.TimeoutError:
                        continue
                    except websockets.exceptions.ConnectionClosed:
                        break
                    # parse heartbeat
                    try:
                        d = json.loads(msg)
                        if d.get('type') == 'heartbeat' or 'heartbeat' in d.get('type',''):
                            now = time.time()
                            ts = d.get('ts') or d.get('timestamp') or d.get('t')
                            if ts:
                                latency = now - float(ts)
                                stats.heartbeat_latencies.append(latency)
                            stats.heartbeat_count += 1
                            stats.last_heartbeat = now
                    except Exception:
                        stats.errors += 1
                stats.disconnects += 1
        except Exception:
            stats.errors += 1
        # reconnect with backoff
        stats.reconnects += 1
        await asyncio.sleep(backoff)
        backoff = min(backoff * 2, 5.0)

async def run_test():
    run_event = asyncio.Event()
    stats_list = []
    tasks = []

    for i in range(NUM_EVENTS):
        s = ClientStats()
        stats_list.append(('events', i, s))
        tasks.append(asyncio.create_task(ws_client(EVENTS_URL, s, run_event, i)))
    for i in range(NUM_SESSIONS):
        s = ClientStats()
        stats_list.append(('session', i, s))
        tasks.append(asyncio.create_task(ws_client(SESSION_URL, s, run_event, i)))

    print('Started', len(tasks), 'clients. Running for', TEST_DURATION, 's')
    await asyncio.sleep(TEST_DURATION)
    run_event.set()
    # give clients a moment to cleanup
    await asyncio.sleep(1)
    for t in tasks:
        t.cancel()
    # summarize
    total_connects = sum(s.connects for _,_,s in stats_list)
    total_disconnects = sum(s.disconnects for _,_,s in stats_list)
    total_reconnects = sum(s.reconnects for _,_,s in stats_list)
    total_heartbeats = sum(s.heartbeat_count for _,_,s in stats_list)
    all_latencies = [lat for _,_,s in stats_list for lat in s.heartbeat_latencies]
    total_errors = sum(s.errors for _,_,s in stats_list)

    print('--- SUMMARY ---')
    print('clients:', len(tasks))
    print('total_connects:', total_connects)
    print('total_disconnects:', total_disconnects)
    print('total_reconnects:', total_reconnects)
    print('total_heartbeats:', total_heartbeats)
    print('total_errors:', total_errors)
    if all_latencies:
        print('avg_heartbeat_latency_ms:', statistics.mean(all_latencies)*1000)
        print('p95_latency_ms:', statistics.quantiles(all_latencies, n=100)[94]*1000)
    else:
        print('no heartbeats recorded')

if __name__ == '__main__':
    asyncio.run(run_test())
