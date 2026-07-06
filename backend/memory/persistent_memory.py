import asyncio
import json
import os
import time
from typing import Any


class PersistentMemory:
    """Simple JSON-per-session persistent storage for streamed tokens and execution logs.

    Files stored under `storage/sessions/{session_id}.json`.
    """

    def __init__(self, base_dir: str | None = None):
        self.base_dir = base_dir or os.path.join(os.path.dirname(__file__), "..", "storage")
        self.sessions_dir = os.path.join(self.base_dir, "sessions")
        os.makedirs(self.sessions_dir, exist_ok=True)
        self._locks: dict[str, asyncio.Lock] = {}

    def _session_path(self, session_id: str) -> str:
        safe = session_id.replace("/", "_")
        return os.path.join(self.sessions_dir, f"{safe}.json")

    def _ensure_lock(self, session_id: str) -> asyncio.Lock:
        if session_id not in self._locks:
            self._locks[session_id] = asyncio.Lock()
        return self._locks[session_id]

    def _default_session(self, session_id: str) -> dict:
        return {
            "session_id": session_id,
            "messages": [],
            "events": [],
            "workflow_history": [],
            "token_usage": {},
            "metrics": {},
            "agent_logs": [],
            "created_ts": int(time.time() * 1000),
        }

    def get_session(self, session_id: str) -> dict:
        path = self._session_path(session_id)
        if not os.path.exists(path):
            return self._default_session(session_id)
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return self._default_session(session_id)

    def _write_session(self, session_id: str, data: dict):
        path = self._session_path(session_id)
        tmp = path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, path)

    async def append_event(self, session_id: str, event: dict):
        lock = self._ensure_lock(session_id)
        async with lock:
            data = self.get_session(session_id)
            data.setdefault("events", []).append(event)
            self._write_session(session_id, data)

    async def append_message(self, session_id: str, message: dict):
        lock = self._ensure_lock(session_id)
        async with lock:
            data = self.get_session(session_id)
            data.setdefault("messages", []).append(message)
            self._write_session(session_id, data)

    async def append_stream_chunk(self, session_id: str, chunk: dict):
        # chunk: {type:'token', token:'a', index:.., meta:...}
        await self.append_event(session_id, {**chunk, "event_type": "token_stream"})

    async def finalize_response(self, session_id: str, response: dict):
        lock = self._ensure_lock(session_id)
        async with lock:
            data = self.get_session(session_id)
            data.setdefault("messages", []).append({
                "role": "assistant",
                "content": response.get("content", ""),
                "tokens": response.get("tokens", 0),
                "latency_ms": response.get("latency_ms"),
                "model": response.get("model"),
                "ts": int(time.time() * 1000),
            })
            data.setdefault("token_usage", {})[response.get("model", "unknown")] = data.setdefault("token_usage", {}).get(response.get("model", "unknown"), 0) + response.get("tokens", 0)
            data.setdefault("metrics", {}).setdefault("last_response_latency_ms", response.get("latency_ms"))
            self._write_session(session_id, data)

    async def record_token_usage(self, session_id: str, model: str, tokens: int):
        lock = self._ensure_lock(session_id)
        async with lock:
            data = self.get_session(session_id)
            tu = data.setdefault("token_usage", {})
            tu[model] = tu.get(model, 0) + tokens
            self._write_session(session_id, data)

    async def record_metrics(self, session_id: str, metrics: dict):
        lock = self._ensure_lock(session_id)
        async with lock:
            data = self.get_session(session_id)
            data.setdefault("metrics", {}).update(metrics)
            self._write_session(session_id, data)

    async def record_agent_log(self, session_id: str, log: dict):
        lock = self._ensure_lock(session_id)
        async with lock:
            data = self.get_session(session_id)
            data.setdefault("agent_logs", []).append(log)
            self._write_session(session_id, data)

    async def update_workflow_node(self, session_id: str, node_state: dict):
        lock = self._ensure_lock(session_id)
        async with lock:
            data = self.get_session(session_id)
            data.setdefault("workflow_history", []).append(node_state)
            self._write_session(session_id, data)
