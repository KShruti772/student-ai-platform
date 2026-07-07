from typing import Any

from pydantic import BaseModel, Field


class WorkflowNode(BaseModel):
    id: str
    label: str
    data: dict[str, Any] | None = None


class WorkflowEdge(BaseModel):
    source: str
    target: str


class WorkflowResponse(BaseModel):
    nodes: list[WorkflowNode] = Field(default_factory=list)
    edges: list[WorkflowEdge] = Field(default_factory=list)
    status: str = "idle"
    progress: int = 0
