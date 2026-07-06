"""Lightweight in-process pub/sub for agent coordination and events."""
import asyncio
from typing import Callable, Dict, Any, List

class MessageBus:
    def __init__(self):
        self._subs: Dict[str, List[Callable]] = {}

    def subscribe(self, topic: str, cb: Callable):
        self._subs.setdefault(topic, []).append(cb)

    def unsubscribe(self, topic: str, cb: Callable):
        if topic in self._subs and cb in self._subs[topic]:
            self._subs[topic].remove(cb)

    async def publish(self, topic: str, payload: Dict[str, Any]):
        for cb in list(self._subs.get(topic, [])):
            try:
                if asyncio.iscoroutinefunction(cb):
                    await cb(payload)
                else:
                    cb(payload)
            except Exception:
                pass

bus = MessageBus()
