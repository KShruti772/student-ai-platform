"""
FastAPI routes for Autonomous Builder
"""
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any
from .orchestrator_agent import OrchestratorAgent

router = APIRouter()
orch = OrchestratorAgent()


class CreateProjectRequest(BaseModel):
    name: str
    goal: str


@router.post("/autobuilder/create")
async def create_project(req: CreateProjectRequest, background_tasks: BackgroundTasks):
    # Run orchestration in background to keep API responsive
    def task():
        orch.run_project_creation(req.name, req.goal)

    background_tasks.add_task(task)
    return {"status": "started", "workspace": f"workspaces/{req.name}"}


@router.get("/autobuilder/tools")
async def list_tools():
    # lightweight listing; real registry can be expanded
    return {"tools": ["file_write", "run_shell", "create_workspace"]}
