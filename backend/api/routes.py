"""
API routes exposing agent endpoints.

Purpose:
- Provide REST endpoints for frontend to call each agent and the combined workflow.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from workflows.student_workflow import StudentWorkflow
from memory.session_memory import SessionMemory
from agents.mentor_agent import MentorAgent
from utils.logger import get_logger, log_execution
import json
from workflows.agent_orchestrator import AgentOrchestrator
from api.services import chat as chat_service
from api.services import mentor as mentor_service
from config.settings import settings

orchestrator = AgentOrchestrator()

router = APIRouter()
workflow = StudentWorkflow()
mentor_agent = MentorAgent()
_LOG = get_logger(__name__)


class Query(BaseModel):
    message: str
    session_id: str = "default"


@router.post("/chat")
async def chat(query: Query):
    result = await chat_service.send_chat(query.message, query.session_id)
    debug = result.debug if settings.environment != "production" else None
    return {"response": result.response, "error": result.error, "debug": debug}


@router.post("/planner")
async def planner(query: Query):
    result = workflow.planner.generate(query.message)
    return {"plan": result}


@router.post("/mentor")
async def mentor(query: Query):
    result = await mentor_service.handle_mentor(query.message, query.session_id)
    debug = result.get("debug") if settings.environment != "production" else None
    return {"response": result.get("response"), "error": result.get("error"), "debug": debug}


@router.post("/mentor/chat")
@log_execution(_LOG)
def mentor_chat(query: Query):
    """Structured mentor endpoint.

    Returns JSON with educational sections so frontends can render learning content.
    """
    _LOG.info("/mentor/chat incoming: session=%s", query.session_id)
    session = SessionMemory(session_id=query.session_id)
    session.load()

    try:
        response = mentor_agent.mentor_reply(query.message, session)
        # Ensure output is JSON-serializable
        if isinstance(response, str):
            return {"response": response}
        # If the model returned a dict with expected fields, map them
        if isinstance(response, dict):
            # Normalize learning_points to a list if present as string
            lp = response.get("learning_points")
            if isinstance(lp, str):
                try:
                    response["learning_points"] = json.loads(lp)
                except Exception:
                    # fallback: keep as single-item list
                    response["learning_points"] = [lp]
            return {"response": response}

        return {"response": {"raw": str(response)}}
    except Exception as e:
        _LOG.exception("Error in mentor/chat: %s", e)
        return {"error": str(e)}


@router.post("/explain")
async def explain(query: Query):
    result = workflow.explainer.generate(query.message)
    return {"explain": result}


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.post("/workflow/project-build")
@log_execution(_LOG)
def workflow_project_build(query: Query):
    _LOG.info("/workflow/project-build session=%s", query.session_id)
    session = SessionMemory(session_id=query.session_id)
    session.load()
    try:
        out = orchestrator.run_project_build(query.message, session)
        return out
    except Exception as e:
        _LOG.exception("Workflow project build failed: %s", e)
        return {"error": str(e)}


@router.post("/workflow/debug")
@log_execution(_LOG)
def workflow_debug(query: Query):
    session = SessionMemory(session_id=query.session_id)
    session.load()
    # Pass message to DebuggerAgent directly
    dbg = orchestrator.debugger.analyze(query.message)
    session.add_debug_context({"manual_debug": dbg})
    session.save()
    return {"debug": dbg}


@router.post("/workflow/explain")
@log_execution(_LOG)
def workflow_explain(query: Query):
    session = SessionMemory(session_id=query.session_id)
    session.load()
    expl = orchestrator.explainer.generate(query.message)
    session.add_explanation({"manual_explain": expl})
    session.save()
    return {"explain": expl}


@router.post("/workflow/review")
@log_execution(_LOG)
def workflow_review(query: Query):
    session = SessionMemory(session_id=query.session_id)
    session.load()
    # review the current code in session
    code_blob = "\n\n".join(session.code_files.values()) if session.code_files else query.message
    review = orchestrator.reviewer.review(code_blob)
    session.add_explanation({"review": review})
    session.save()
    return {"review": review}
