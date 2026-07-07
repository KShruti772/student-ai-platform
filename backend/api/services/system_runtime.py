from __future__ import annotations

import asyncio
import importlib.util
import importlib.metadata
import platform
import sys
import time
from typing import Any

from config.settings import settings
from local_ai.model_manager import model_manager
from utils.logger import get_logger

try:
    import psutil
except Exception:
    psutil = None

_LOG = get_logger(__name__)
_STARTED_AT = time.time()
_MONITOR_TASK: asyncio.Task | None = None

_services: dict[str, str] = {
    "agents": "loading",
    "rag": "loading",
    "resume": "loading",
    "knowledge": "loading",
    "project_builder": "loading",
    "workflow_studio": "loading",
    "upload": "online",
}


def mark_service(name: str, status: str) -> None:
    _services[name] = status
    _LOG.info("%s %s", name.replace("_", " ").title(), status.title())


def uptime_seconds() -> int:
    return int(time.time() - _STARTED_AT)


def health_status() -> dict[str, Any]:
    model = model_manager.status()
    lmstudio = model["lmstudio"]
    service_map = dict(_services)
    return {
        "backend": "online",
        "lmstudio": lmstudio,
        "model": settings.model_name,
        "version": "1.0",
        "uptime": uptime_seconds(),
        "services": service_map,
        "details": {
            "api_url": settings.backend_api_url,
            "provider": settings.model_provider,
            "environment": settings.environment,
            "lmstudio_url": settings.openai_base_url,
            "model_ready": model["model_ready"],
            "loaded_models": model["loaded_models"],
            "latency_ms": model["latency_ms"],
            "context_size": model["context_size"],
            "gpu": model["gpu"],
            "error": model["error"],
            "last_checked": model["checked_at"],
        },
    }


async def run_lmstudio_monitor(interval: float = 15.0) -> None:
    _LOG.info("LM Studio monitor started")
    while True:
        try:
            await model_manager.refresh_status(timeout=2.0)
        except Exception as exc:
            _LOG.warning("LM Studio monitor error: %s", exc)
        await asyncio.sleep(interval)


def start_background_monitors() -> asyncio.Task:
    global _MONITOR_TASK
    if _MONITOR_TASK is None or _MONITOR_TASK.done():
        _MONITOR_TASK = asyncio.create_task(run_lmstudio_monitor())
    return _MONITOR_TASK


async def diagnostics() -> dict[str, Any]:
    model = await model_manager.refresh_status(timeout=2.0)
    memory = _memory_status()
    packages = _package_status(["fastapi", "uvicorn", "httpx", "pydantic", "python-dotenv"])
    vector_status = _import_status("chromadb")
    return {
        "backend": {
            "status": "online",
            "version": "1.0",
            "uptime": uptime_seconds(),
            "python": sys.version.split()[0],
            "platform": platform.platform(),
        },
        "environment": {
            "api_url": settings.backend_api_url,
            "provider": settings.model_provider,
            "mode": settings.environment,
            "cors_origins": settings.cors_origins,
        },
        "lmstudio": {
            "status": model["lmstudio"],
            "url": settings.openai_base_url,
            "latency_ms": model["latency_ms"],
            "error": model["error"],
        },
        "model": {
            "configured": settings.model_name,
            "loaded": model["loaded_models"],
            "ready": model["model_ready"],
            "context_size": model["context_size"],
            "gpu": model["gpu"],
        },
        "system": {
            "ram": memory,
            "gpu": model["gpu"] or "unknown",
        },
        "dependencies": packages,
        "services": {
            **dict(_services),
            "vector_db": vector_status,
            "resume_agent": _services.get("resume", "unknown"),
            "knowledge_agent": _services.get("knowledge", "unknown"),
            "project_builder": _services.get("project_builder", "unknown"),
            "workflow_studio": _services.get("workflow_studio", "unknown"),
        },
        "upload": {
            "status": _services.get("upload", "online"),
            "max_size_mb": 20,
        },
    }


async def inference_test() -> dict[str, Any]:
    started = time.perf_counter()
    try:
        text = await model_manager.generate_text(
            [{"role": "user", "content": "Reply only OK"}],
            temperature=0,
            max_tokens=4,
            timeout=20,
            retries=1,
        )
        ok = text.strip().upper().startswith("OK")
        return {
            "ok": ok,
            "inference": {
                "status": "ok" if ok else "failed",
                "latency_ms": int((time.perf_counter() - started) * 1000),
                "error": None if ok else f"Expected OK, received: {text[:120] or 'empty response'}",
            },
            "timestamp": time.time(),
        }
    except Exception as exc:
        error = str(exc)
        timed_out = "timeout" in error.lower() or "timed out" in error.lower()
        return {
            "ok": False,
            "inference": {
                "status": "timeout" if timed_out else "failed",
                "latency_ms": int((time.perf_counter() - started) * 1000),
                "error": "Model is loaded but response test timed out. Try a smaller model or increase timeout." if timed_out else error,
            },
            "timestamp": time.time(),
        }


def _memory_status() -> dict[str, Any]:
    if psutil is None:
        return {"available": "unknown", "used": "unknown", "percent": None}
    try:
        vm = psutil.virtual_memory()
        return {
            "available_gb": round(vm.available / 1024 / 1024 / 1024, 2),
            "used_gb": round(vm.used / 1024 / 1024 / 1024, 2),
            "percent": vm.percent,
        }
    except Exception as exc:
        return {"error": str(exc)}


def _package_status(names: list[str]) -> dict[str, str]:
    result: dict[str, str] = {}
    for name in names:
        try:
            result[name] = importlib.metadata.version(name)
        except importlib.metadata.PackageNotFoundError:
            result[name] = "missing"
    return result


def _import_status(module_name: str) -> str:
    return "online" if importlib.util.find_spec(module_name) is not None else "offline"
