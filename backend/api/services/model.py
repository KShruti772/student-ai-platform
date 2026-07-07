import time
from config.settings import settings
from local_ai.model_manager import model_manager

try:
    import psutil
except Exception:
    psutil = None


def _probe_model() -> dict:
    status = model_manager.status()
    latency = status.get("latency_ms")
    throughput = 0 if not latency or latency < 0 else int(1000 / max(latency, 1))
    return {"latency": latency if latency is not None else -1, "throughput": throughput, "tokens": 0}


async def get_model_status() -> dict:
    status = model_manager.status()
    return {
        "provider": settings.model_provider,
        "base_url": settings.openai_base_url,
        "model": settings.model_name,
        "connected": status["lmstudio"] == "online",
        "model_loaded": bool(status["model_ready"]),
        "available_models": status["loaded_models"],
        "error": status["error"],
    }


async def test_model() -> dict:
    prompt = "Reply with exactly one short sentence confirming LM Studio is connected."
    messages = [
        {"role": "system", "content": "You are a concise diagnostic assistant."},
        {"role": "user", "content": prompt},
    ]
    start = time.time()
    try:
        text = await model_manager.generate_text(messages, max_tokens=80, timeout=settings.ai_request_timeout, retries=1)
        return {
            "ok": True,
            "provider": settings.model_provider,
            "model": settings.model_name,
            "base_url": settings.openai_base_url,
            "latency_ms": int((time.time() - start) * 1000),
            "response": text,
        }
    except Exception as e:
        return {
            "ok": False,
            "provider": settings.model_provider,
            "model": settings.model_name,
            "base_url": settings.openai_base_url,
            "latency_ms": int((time.time() - start) * 1000),
            "error": str(e),
        }


async def get_model_metrics() -> list[dict]:
    # return a single-point list for compatibility with frontend types
    point = _probe_model()
    ts = int(time.time() * 1000)
    memory_mb = None
    if psutil is not None:
        try:
            memory_mb = int(psutil.virtual_memory().used / 1024 / 1024)
        except Exception:
            memory_mb = None

    # Provide both latency and latencyMs for backward/forward compatibility
    latency_val = point.get("latency")
    return [{
        "ts": ts,
        "latency": latency_val,
        "latencyMs": latency_val,
        "throughput": point.get("throughput"),
        "tokens": point.get("tokens"),
        "model": getattr(settings, "model_name", "local_model"),
        "memory_mb": memory_mb,
        "queue_size": 0,
        "requests_per_sec": point.get("throughput"),
        "context_usage": None,
    }]
