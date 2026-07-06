import asyncio
import time
from typing import Any, Callable


class EventBus:
    """Simple async-safe event bus with persistent replay support.

    Methods mimic an asyncio.Queue for compatibility with existing broadcaster.
    """

    def __init__(self, persistent=None, maxlen=10000):
        self._queue: asyncio.Queue = asyncio.Queue()
        self._persistent = persistent
        self._replay_buffer: list[dict] = []
        self._maxlen = maxlen

    async def publish(self, event: dict):
        # attach server timestamp
        event = dict(event)
        event.setdefault("ts", int(time.time() * 1000))
        # store in replay buffer (in-memory)
        self._replay_buffer.append(event)
        if len(self._replay_buffer) > self._maxlen:
            self._replay_buffer.pop(0)
        # persist if persistent storage available
        try:
            if self._persistent is not None and "session_id" in event:
                await self._persistent.append_event(event["session_id"], event)
        except Exception:
            # never let persistence break event delivery
            pass

        await self._queue.put(event)

    # compatibility shim: some code calls `put` on the queue
    async def put(self, event: dict):
        await self.publish(event)

    # keep compatibility with asyncio.Queue API used in broadcaster
    async def get(self) -> dict:
        return await self._queue.get()

    def empty(self) -> bool:
        return self._queue.empty()

    def replay(self, session_id: str | None = None) -> list:
        # if persistent exists, prefer persisted events for session
        if self._persistent is not None and session_id:
            try:
                data = self._persistent.get_session(session_id)
                return data.get("events", []) or []
            except Exception:
                pass
        # fallback to in-memory buffer
        return list(self._replay_buffer)
