from fastapi import APIRouter
from ..schemas import projects as projects_schema
from ..services import projects as projects_service

router = APIRouter()


@router.get("/analytics", response_model=projects_schema.ProjectAnalytics)
async def get_analytics():
    return await projects_service.get_project_analytics()
