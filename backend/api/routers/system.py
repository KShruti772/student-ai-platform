from fastapi import APIRouter

from ..services.system_runtime import diagnostics, health_status, inference_test

router = APIRouter()


@router.get("/status")
async def system_status():
    return health_status()


@router.post("/inference-test")
async def system_inference_test():
    return await inference_test()


@router.get("/diagnostics")
async def system_diagnostics():
    return await diagnostics()
