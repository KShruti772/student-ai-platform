from fastapi import APIRouter
from workflows.workflow_engine import WorkflowEngine
from utils.logger import get_logger

router = APIRouter()
_LOG = get_logger(__name__)

engine = WorkflowEngine()


@router.post("/orchestrator/submit")
def submit(task: dict):
    tid = engine.submit_task(task)
    return {"task_id": tid}


@router.post("/orchestrator/run-next")
def run_next():
    return engine.run_next()


@router.post("/orchestrator/run-all")
def run_all():
    return engine.run_all()


@router.get("/orchestrator/agents")
def list_agents():
    return {"agents": list(engine.agents.keys())}
