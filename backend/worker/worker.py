"""Worker process that consumes workflow jobs from Redis and executes them.

Usage:
  python backend/worker/worker.py

Requires `REDIS_URL` environment variable or default redis://localhost:6379
"""
import os
import json
import time
from config.settings import settings
from workflows.agent_orchestrator import AgentOrchestrator
from utils.logger import get_logger

logger = get_logger(__name__)

try:
    import redis
except Exception:
    redis = None


def main():
    url = os.getenv("REDIS_URL") or settings.redis_url or "redis://localhost:6379"
    if redis is None:
        logger.error("redis library not installed; install redis>=4.6.0")
        return

    r = redis.from_url(url, decode_responses=True)
    orch = AgentOrchestrator()
    logger.info("Worker connected to Redis at %s", url)

    while True:
        try:
            item = r.brpop("workflows:queue", timeout=5)
            if not item:
                time.sleep(1)
                continue
            _, payload = item
            job = json.loads(payload)
            wid = job.get("id")
            goal = job.get("goal")
            # load session if present (session is serialized via session_id)
            session_id = job.get("session_id", "default")
            # For simplicity, pass a SessionMemory instance if available
            try:
                from memory.session_memory import SessionMemory
                session = SessionMemory(session_id=session_id)
                session.load()
            except Exception:
                session = None

            # publish started
            # check if a DAG is stored in the workflow hash
            try:
                dag_raw = r.hget(f"workflow:{wid}", "dag")
            except Exception:
                dag_raw = None

            r.publish("events", json.dumps({"type": "workflow.started", "workflow_id": wid, "goal": goal}))
            try:
                result = None
                if dag_raw:
                    try:
                        dag = json.loads(dag_raw)
                        from workflows.dag_runner import run_dag_sync
                        result = run_dag_sync(dag)
                    except Exception:
                        logger.exception("Failed to run DAG locally; falling back to run_project_build")
                        result = orch.run_project_build(goal, session)
                else:
                    result = orch.run_project_build(goal, session)
                # persist result
                r.hset(f"workflow:{wid}", mapping={"status": "completed", "result": json.dumps(result)})
                r.publish("events", json.dumps({"type": "workflow.completed", "workflow_id": wid, "result": result}))
            except Exception as e:
                logger.exception("Worker failed job %s: %s", wid, e)
                r.hset(f"workflow:{wid}", mapping={"status": "failed", "result": json.dumps({"error": str(e)})})
                r.publish("events", json.dumps({"type": "workflow.failed", "workflow_id": wid, "error": str(e)}))
        except Exception:
            logger.exception("Worker loop exception")
            time.sleep(1)


if __name__ == "__main__":
    main()
