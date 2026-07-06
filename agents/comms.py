"""Lightweight in-process agent communication helpers"""
from typing import Dict, Any
import asyncio


class MessageBus:
    """Very small message bus for agents to publish/subscribe in-process."""

    def __init__(self):
        self.queues = {}

    def subscribe(self, topic: str):
        q = asyncio.Queue()
        self.queues.setdefault(topic, []).append(q)
        return q

    async def publish(self, topic: str, msg: Dict[str, Any]):
        for q in self.queues.get(topic, []):
            await q.put(msg)
