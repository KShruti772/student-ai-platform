from fastapi import APIRouter
from ..schemas import agents as agents_schemas
from ..services import agents as agents_service

router = APIRouter()


@router.get("/activity", response_model=list[agents_schemas.AgentActivity])
async def get_activity():
    """Return current agent activity list."""
    return await agents_service.get_agent_activity()
