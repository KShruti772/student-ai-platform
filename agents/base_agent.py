"""BaseAgent: common interface and utilities for all agents."""
from typing import Dict, Any
import asyncio
import time
import uuid

from .logger import get_logger

_LOG = get_logger(__name__)


class BaseAgent:
    def __init__(self, name: str):
        self.name = name

    async def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Run the agent with structured tracing and error handling."""
        trace_id = str(uuid.uuid4())
        start = time.time()
        _LOG.info("[%s][%s] start", self.name, trace_id)
        try:
            res = await self.handle(payload)
            duration = time.time() - start
            out = {
                "agent": self.name,
                "ok": True,
                "trace_id": trace_id,
                "duration": duration,
                "result": res,
            }
            _LOG.info("[%s][%s] ok (%.2fs)", self.name, trace_id, duration)
            return out
        except Exception as e:
            duration = time.time() - start
            _LOG.exception("[%s][%s] error", self.name, trace_id)
            return {"agent": self.name, "ok": False, "trace_id": trace_id, "duration": duration, "error": str(e)}

    async def handle(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Override in subclasses with async behaviour."""
        raise NotImplementedError()
"""BaseAgent and simple messaging primitives"""
from typing import Any, Dict
import asyncio
from .logger import get_logger

_LOG = get_logger(__name__)


class BaseAgent:
    """Base class for agents. Agents should override `handle` to implement behavior.

    All agents expose async `run()` that returns structured JSON.
    """

    def __init__(self, name: str):
        self.name = name

    async def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        _LOG.info("%s received payload: %s", self.name, {k: v for k, v in payload.items() if k!='secret'})
        try:
            result = await self.handle(payload)
            return {"agent": self.name, "ok": True, "result": result}
        except Exception as e:
            _LOG.exception("Error in %s", self.name)
            return {"agent": self.name, "ok": False, "error": str(e)}

    async def handle(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError()
