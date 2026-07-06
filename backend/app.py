"""
Backend entrypoint for the Student AI Platform.

Purpose:
- Initialize FastAPI app, enable CORS, and mount API routes.
- Provide health, test and chat endpoints for frontend integration.

Design notes:
- Kept minimal and educational so students can follow how APIs connect to agents.
"""
from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from api.routes import router as api_router
from api.routers import router as api_v2_router
from api.knowledge_routes import router as knowledge_router
from api.skills_routes import router as skills_router
from api.orchestrator_routes import router as orchestrator_router
from api.ws_routes import router as ws_router, start_broadcaster
from core.event_bus import EventBus
from memory.persistent_memory import PersistentMemory
from config.settings import settings
from utils.logger import get_logger
import asyncio
from orchestrator.async_orchestrator import AsyncOrchestrator

logger = get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Student AI Platform backend (FastAPI) - lifespan start")
    # initialize async orchestrator, persistent memory and event bus
    app.state.persistent_memory = PersistentMemory()
    app.state.event_bus = EventBus(persistent=app.state.persistent_memory)
    app.state.orchestrator = AsyncOrchestrator()
    await app.state.orchestrator.start(app.state.event_bus)

    # Start websocket broadcaster task (EventBus compatible)
    broadcaster_task = asyncio.create_task(start_broadcaster(app.state.event_bus))
    app.state._broadcaster_task = broadcaster_task

    try:
        yield
    finally:
        logger.info("Shutting down Student AI Platform backend - cancelling background tasks")
        try:
            broadcaster_task.cancel()
            await broadcaster_task
        except Exception:
            pass


app = FastAPI(title="Student AI Platform - Backend",
              description="Local-first, educational AI backend using LM Studio-compatible models",
              version="0.1",
              lifespan=lifespan)


# Simple middleware to log requests with timing and assign request IDs
@app.middleware("http")
async def request_logger(request, call_next):
    import time, uuid
    rid = str(uuid.uuid4())
    start = time.time()
    try:
        response = await call_next(request)
        duration = (time.time() - start) * 1000
        logger.info("%s %s %s %.2fms", request.method, request.url.path, rid, duration)
        response.headers["X-Request-Id"] = rid
        return response
    except Exception as e:
        duration = (time.time() - start) * 1000
        logger.exception("Error handling request %s %s %s after %.2fms: %s", request.method, request.url.path, rid, duration, e)
        # safe JSON fallback
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"error": "internal_server_error", "request_id": rid})

# Enable CORS so a frontend (served separately) can call these APIs during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes defined in api/routes.py
app.include_router(api_router)
# New unified API router under /api
app.include_router(api_v2_router)
app.include_router(knowledge_router)
app.include_router(skills_router)
app.include_router(orchestrator_router)
app.include_router(ws_router)


class TestRequest(BaseModel):
    message: str


# NOTE: app startup is handled via the `lifespan` context manager above.


@app.get("/health")
async def health():
    """Health check endpoint.

    FastAPI is a modern, fast (high-performance) web framework for building APIs with Python.
    The frontend will call these endpoints to talk to the agents and workflows.
    """
    return {"status": "ok"}


@app.post("/test")
async def test(req: TestRequest):
    """Simple test route to verify request/response flow."""
    logger.info("Received test message: %s", req.message)
    return {"echo": req.message}


if __name__ == "__main__":
    # For local development: `python backend/app.py`
    uvicorn.run("app:app", host="0.0.0.0", port=8002, reload=True)
