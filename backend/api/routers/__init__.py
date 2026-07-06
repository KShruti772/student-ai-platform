from fastapi import APIRouter, Request
from config.settings import settings

from .agents import router as agents_router
from .workflow import router as workflow_router
from .model import router as model_router
from .projects import router as projects_router
from .chat import router as chat_router
from .mentor import router as mentor_router
from .session import router as session_router

router = APIRouter(prefix="/api")

router.include_router(agents_router, prefix="/agents")
router.include_router(workflow_router, prefix="/workflow")
router.include_router(model_router, prefix="/model")
router.include_router(projects_router, prefix="/projects")
router.include_router(chat_router)
router.include_router(mentor_router)
router.include_router(session_router)


@router.get("/health/full")
async def health_full(req: Request):
	"""Return a full health & diagnostics summary for the API and internal services."""
	pm = getattr(req.app.state, "persistent_memory", None)
	eb = getattr(req.app.state, "event_bus", None)
	orch = getattr(req.app.state, "orchestrator", None)
	return {
		"status": "ok",
		"persistent_memory": pm is not None,
		"event_bus": eb is not None,
		"orchestrator": orch is not None,
		"model_api_url": getattr(settings, "api_url", None),
	}


print("LOADING AGENTS")
from .agents import router as agents_router

print("LOADING WORKFLOW")
from .workflow import router as workflow_router

print("LOADING MODEL")
from .model import router as model_router

print("LOADING PROJECTS")
from .projects import router as projects_router

print("LOADING CHAT")
from .chat import router as chat_router

print("LOADING MENTOR")
from .mentor import router as mentor_router

print("ALL ROUTERS LOADED")