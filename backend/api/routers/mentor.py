from fastapi import APIRouter
from ..schemas.chat import ChatRequest, ChatResponse
from ..services import mentor as mentor_service
from config.settings import settings

router = APIRouter()


@router.post("/mentor", response_model=ChatResponse)
async def mentor(req: ChatRequest):
    resp = await mentor_service.handle_mentor(req.message, req.session_id)
    debug = resp.get("debug") if settings.environment != "production" else None
    return ChatResponse(response=resp.get("response"), error=resp.get("error"), debug=debug)
