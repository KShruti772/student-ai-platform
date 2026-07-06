from fastapi import APIRouter, Request
from ..schemas.chat import ChatRequest, ChatResponse
from ..services import chat as chat_service
from config.settings import settings

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(req: Request, payload: ChatRequest):
    # pass app event bus to service so tokens are emitted to connected websocket clients
    event_bus = getattr(req.app.state, "event_bus", None)
    persistent = getattr(req.app.state, "persistent_memory", None)
    resp = await chat_service.send_chat(payload.message, payload.session_id, event_bus, persistent)
    debug = resp.debug if settings.environment != "production" else None
    return ChatResponse(response=resp.response, error=resp.error, debug=debug)
