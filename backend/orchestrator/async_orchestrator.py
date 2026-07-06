
import asyncio
import concurrent.futures
import uuid
import json
from typing import Any, Dict
from workflows.agent_orchestrator import AgentOrchestrator
from utils.logger import get_logger
from config.settings import settings

try:
    import redis.asyncio as aioredis
except Exception:
    aioredis = None
from workflows.dag_engine import WorkflowDAG, DagExecutor

_LOG = get_logger(__name__)


class AsyncOrchestrator:
    def __init__(self):
        self._agent_orch = AgentOrchestrator()
        self._queue: asyncio.Queue = asyncio.Queue()
        self._workflows: Dict[str, Dict[str, Any]] = {}
        self._running = False
        self._executor = concurrent.futures.ThreadPoolExecutor(max_workers=2)
        self._redis = None

    async def start(self, event_bus: asyncio.Queue):
        """Start background worker that processes workflow jobs."""
        if self._running:
            return
        self._running = True
        self._event_bus = event_bus
        # initialize optional Redis client for persistence
        if getattr(settings, "redis_url", None):
            if aioredis is not None:
                try:
                    self._redis = aioredis.from_url(settings.redis_url, decode_responses=True)
                    await self._redis.ping()
                    _LOG.info("Connected to Redis at %s", settings.redis_url)
                except Exception:
                    _LOG.exception("Failed to connect to Redis; continuing without Redis persistence")
                    self._redis = None
            else:
                _LOG.warning("redis.asyncio not available; install 'redis' package for persistence")

        asyncio.create_task(self._worker_loop())
        _LOG.info("AsyncOrchestrator started")

    async def stop(self):
        self._running = False
        self._executor.shutdown(wait=False)

    async def submit_workflow(self, goal: str, session) -> str:
        wid = str(uuid.uuid4())
        job = {"id": wid, "goal": goal, "session": session}
        self._workflows[wid] = {"status": "queued", "result": None}
        if self._redis is not None:
            try:
                # store minimal metadata and push job onto Redis queue for external workers
                meta = {"status": "queued", "goal": goal}
                await self._redis.hset(f"workflow:{wid}", mapping={"status": "queued", "goal": goal, "result": json.dumps(None)})
                payload = {"id": wid, "goal": goal, "session_id": getattr(session, "session_id", "default")}
                await self._redis.lpush("workflows:queue", json.dumps(payload))
                # publish queued event
                await self._redis.publish("events", json.dumps({"type": "workflow.queued", "workflow_id": wid, "goal": goal}))
            except Exception:
                _LOG.exception("Failed to persist workflow to Redis; fallback to local queue")
                await self._queue.put(job)
                await self._emit_event({"type": "workflow.queued", "workflow_id": wid, "goal": goal})
        else:
            await self._queue.put(job)
            await self._emit_event({"type": "workflow.queued", "workflow_id": wid, "goal": goal})
        return wid

    async def get_status(self, workflow_id: str) -> Dict[str, Any]:
        # check redis first
        if self._redis is not None:
            try:
                h = await self._redis.hgetall(f"workflow:{workflow_id}")
                if h:
                    result = h.get("result")
                    try:
                        result = json.loads(result) if result else None
                    except Exception:
                        pass
                    return {"status": h.get("status"), "goal": h.get("goal"), "result": result}
            except Exception:
                _LOG.exception("Failed to read workflow from Redis")
        return self._workflows.get(workflow_id) or {"status": "not_found"}

    async def _worker_loop(self):
        loop = asyncio.get_running_loop()
        while self._running:
            job = await self._queue.get()
            wid = job["id"]
            goal = job["goal"]
            session = job["session"]
            self._workflows[wid]["status"] = "running"
            await self._emit_event({"type": "workflow.started", "workflow_id": wid, "goal": goal})
            try:
                # If job contains a DAG, execute via DagExecutor
                if job.get("dag"):
                    dag_payload = job.get("dag")
                    dag = WorkflowDAG(dag_payload.get("nodes", []), dag_payload.get("edges", []))
                    # wrap event_putter to inject session_id for persistence
                    session_id = job.get("session", {}).get("session_id") if isinstance(job.get("session"), dict) else None
                    class _EP:
                        def __init__(self, eb, sid=None):
                            self._eb = eb
                            self._sid = sid
                        async def put(self, ev):
                            if self._sid and isinstance(ev, dict):
                                ev = dict(ev)
                                ev.setdefault('session_id', self._sid)
                            await self._eb.put(ev)
                    executor = DagExecutor(dag, event_putter=_EP(self._event_bus, session_id))
                    result = await executor.execute()
                else:
                    # run the synchronous orchestrator.run_project_build in a thread
                    result = await loop.run_in_executor(self._executor, self._agent_orch.run_project_build, goal, session)
                self._workflows[wid]["status"] = "completed"
                self._workflows[wid]["result"] = result
                # persist
                if self._redis is not None:
                    try:
                        await self._redis.hset(f"workflow:{wid}", mapping={"status": "completed", "result": json.dumps(result)})
                    except Exception:
                        _LOG.exception("Failed to persist workflow result to Redis")
                await self._emit_event({"type": "workflow.completed", "workflow_id": wid, "result": result})
            except Exception as e:
                _LOG.exception("Workflow %s failed: %s", wid, e)
                self._workflows[wid]["status"] = "failed"
                self._workflows[wid]["result"] = {"error": str(e)}
                if self._redis is not None:
                    try:
                        await self._redis.hset(f"workflow:{wid}", mapping={"status": "failed", "result": json.dumps({"error": str(e)})})
                    except Exception:
                        _LOG.exception("Failed to persist workflow failure to Redis")
                await self._emit_event({"type": "workflow.failed", "workflow_id": wid, "error": str(e)})
            finally:
                self._queue.task_done()

    async def _emit_event(self, event: Dict[str, Any]):
        try:
            if hasattr(self, "_event_bus") and self._event_bus is not None:
                await self._event_bus.put(event)
        except Exception:
            _LOG.exception("Failed to emit event")
