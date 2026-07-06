import asyncio
import os
from memory.persistent_memory import PersistentMemory


def test_persistent_memory_roundtrip(tmp_path):
    pm = PersistentMemory(base_dir=str(tmp_path))
    sid = "testsess"
    asyncio.get_event_loop().run_until_complete(pm.append_message(sid, {"role":"user","content":"hi"}))
    data = pm.get_session(sid)
    assert data["session_id"] == sid
    assert len(data.get("messages", [])) == 1
