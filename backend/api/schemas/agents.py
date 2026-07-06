from pydantic import BaseModel


class AgentActivity(BaseModel):
    name: str
    status: str
    task: str
