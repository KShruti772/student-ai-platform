from fastapi import APIRouter
from ..schemas import model as model_schema
from ..services import model as model_service

router = APIRouter()


@router.get("/metrics", response_model=list[model_schema.ModelMetricPoint])
async def get_metrics():
    return await model_service.get_model_metrics()


@router.get("/status")
async def get_status():
    return await model_service.get_model_status()


@router.get("/test")
async def test_model():
    return await model_service.test_model()
