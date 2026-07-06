from pydantic import BaseModel
from typing import List, Optional


class TimelineEvent(BaseModel):
    id: str
    type: str
    title: str
    timestamp: Optional[int]
    status: Optional[str]


class TimelineResponse(BaseModel):
    session_id: str
    events: List[TimelineEvent]
