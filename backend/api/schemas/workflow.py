from pydantic import BaseModel
from typing import Any


class WorkflowNode(BaseModel):
    id: str
    label: str
    data: dict | None = None


class WorkflowEdge(BaseModel):
    source: str
    target: str


class WorkflowResponse(BaseModel):
    nodes: list[WorkflowNode]
    edges: list[WorkflowEdge]
