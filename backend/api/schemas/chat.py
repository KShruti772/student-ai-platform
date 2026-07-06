from pydantic import BaseModel
from typing import Optional


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"


class ChatResponse(BaseModel):
    response: Optional[object] = None
    error: Optional[str] = None
    debug: Optional[object] = None
