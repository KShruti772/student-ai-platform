from __future__ import annotations

import asyncio
import time
from datetime import datetime, timezone
from typing import Any, Callable

from config.settings import settings
from local_ai.llm_client import default_llm
from utils.logger import get_logger

_LOG = get_logger(__name__)


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


async def _run_blocking(label: str, func: Callable[[], Any], timeout: float) -> Any:
    loop = asyncio.get_running_loop()
    try:
        return await asyncio.wait_for(loop.run_in_executor(None, func), timeout=timeout)
    except asyncio.TimeoutError:
        _LOG.warning("%s timed out after %.1f seconds", label, timeout)
        return {"error": f"timeout after {int(timeout)} seconds"}
    except Exception as exc:
        _LOG.warning("%s failed: %s", label, exc)
        return {"error": str(exc)}


def _extract_model_ids(models_payload: Any) -> list[str]:
    models = models_payload.get("data", []) if isinstance(models_payload, dict) else []
    return [str(item.get("id")) for item in models if isinstance(item, dict) and item.get("id")]


def _model_error(model_ids: list[str]) -> str | None:
    if not model_ids:
        return "No model loaded in LM Studio."
    if settings.model_name not in model_ids:
        return "Configured model does not match loaded model."
    return None


def _fixes(lmstudio_connected: bool, model_ids: list[str], inference_error: str | None = None) -> list[str]:
    if not lmstudio_connected:
        return [
            "LM Studio is not reachable at http://127.0.0.1:1234/v1.",
            "Start LM Studio, open Local Server, and load a model.",
        ]
    if not model_ids or settings.model_name not in model_ids:
        return [
            "Configured model does not match loaded model.",
            "Update backend/.env MODEL_NAME or load the correct model.",
        ]
    if inference_error:
        return [
            "Model is loaded but response test failed.",
            "Try a smaller model, restart LM Studio, or increase the inference timeout.",
        ]
    return ["Everything looks healthy."]


def _status_response(
    *,
    started: float,
    lmstudio_connected: bool,
    lmstudio_error: str | None,
    model_ids: list[str],
) -> dict[str, Any]:
    model_match = settings.model_name in model_ids
    ok = lmstudio_connected and model_match
    model_error = _model_error(model_ids) if lmstudio_connected else None
    error = lmstudio_error or model_error

    return {
        "ok": ok,
        "backend": {
            "connected": True,
            "status": "running",
        },
        "lmstudio": {
            "connected": lmstudio_connected,
            "url": settings.openai_base_url,
            "error": lmstudio_error,
        },
        "model": {
            "configured": settings.model_name,
            "loaded": model_ids,
            "available": bool(model_ids),
            "match": model_match,
        },
        "inference": {
            "status": "not_checked",
            "latency_ms": None,
            "error": None,
        },
        "environment": {
            "api_url": settings.backend_api_url,
            "provider": settings.model_provider,
            "mode": settings.environment,
        },
        "timestamp": _utc_now(),
        "latency_ms": int((time.time() - started) * 1000),
        "error": error,
        "fixes": _fixes(lmstudio_connected, model_ids),
    }


async def get_system_status() -> dict[str, Any]:
    started = time.time()
    models_payload = await _run_blocking(
        "LM Studio models check",
        lambda: default_llm.list_models(timeout=2),
        timeout=2.2,
    )

    if isinstance(models_payload, dict) and models_payload.get("error"):
        return _status_response(
            started=started,
            lmstudio_connected=False,
            lmstudio_error=str(models_payload["error"]),
            model_ids=[],
        )

    model_ids = _extract_model_ids(models_payload)
    return _status_response(
        started=started,
        lmstudio_connected=True,
        lmstudio_error=None,
        model_ids=model_ids,
    )


async def run_inference_test() -> dict[str, Any]:
    started = time.time()
    response = await _run_blocking(
        "LM Studio inference test",
        lambda: default_llm.generate_text(
            [{"role": "user", "content": "Reply only OK"}],
            temperature=0,
            max_tokens=4,
            timeout=20,
        ),
        timeout=20.5,
    )
    latency_ms = int((time.time() - started) * 1000)

    if isinstance(response, dict) and response.get("error"):
        error = str(response["error"])
        timed_out = "timeout" in error.lower()
        return {
            "ok": False,
            "inference": {
                "status": "timeout" if timed_out else "failed",
                "latency_ms": latency_ms,
                "error": "Model is loaded but response test timed out. Try a smaller model or increase timeout." if timed_out else error,
            },
            "timestamp": _utc_now(),
            "fixes": _fixes(True, [settings.model_name], error),
        }

    text = str(response or "").strip()
    passed = text.upper().startswith("OK")
    return {
        "ok": passed,
        "inference": {
            "status": "ok" if passed else "failed",
            "latency_ms": latency_ms,
            "error": None if passed else f"Expected OK, received: {text[:120] or 'empty response'}",
        },
        "timestamp": _utc_now(),
        "fixes": _fixes(True, [settings.model_name], None if passed else "unexpected response"),
    }
