from fastapi import APIRouter, Request
from config.settings import settings

from .agents import router as agents_router
from .workflow import router as workflow_router
from .model import router as model_router
from .projects import router as projects_router
from .chat import router as chat_router
from .mentor import router as mentor_router
from .resume import router as resume_router
from .session import router as session_router
from .system import router as system_router

router = APIRouter(prefix="/api")

router.include_router(agents_router, prefix="/agents")
router.include_router(workflow_router, prefix="/workflow")
router.include_router(model_router, prefix="/model")
router.include_router(projects_router, prefix="/projects")
router.include_router(chat_router)
router.include_router(mentor_router)
router.include_router(resume_router, prefix="/resume")
router.include_router(session_router)
router.include_router(system_router, prefix="/system")


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
