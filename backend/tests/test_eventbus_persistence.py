import asyncio
import os
from core.event_bus import EventBus
from memory.persistent_memory import PersistentMemory


async def _pub_and_wait(eb, session_id):
    await eb.publish({"type": "token_stream", "session_id": session_id, "token": "a"})


def test_eventbus_persists(tmp_path):
    base = str(tmp_path)
    pm = PersistentMemory(base_dir=base)
    eb = EventBus(persistent=pm)
    sess = "session123"
    asyncio.get_event_loop().run_until_complete(_pub_and_wait(eb, sess))
    data = pm.get_session(sess)
    assert data["session_id"] == sess
    assert len(data.get("events", [])) >= 1
