"""Helper to run async DagExecutor from synchronous contexts."""
import asyncio
from .dag_engine import WorkflowDAG, DagExecutor


def run_dag_sync(dag_payload, event_putter=None):
    dag = WorkflowDAG(dag_payload.get("nodes", []), dag_payload.get("edges", []))
    exe = DagExecutor(dag, event_putter=event_putter)
    try:
        return asyncio.run(exe.execute())
    except RuntimeError:
        # if there's already an event loop running, create a new one in a thread
        import threading
        result_container = {}

        def _run():
            import asyncio as _a
            result_container["res"] = _a.run(exe.execute())

        t = threading.Thread(target=_run)
        t.start()
        t.join()
        return result_container.get("res")
