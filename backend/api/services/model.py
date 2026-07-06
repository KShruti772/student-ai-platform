import time
from config.settings import settings
from local_ai.llm_client import default_llm

try:
    import psutil
except Exception:
    psutil = None


def _probe_model() -> dict:
    start = time.time()
    try:
        raw = default_llm.generate_response(
            [{"role": "user", "content": "Ping"}],
            max_tokens=1,
            timeout=min(settings.ai_request_timeout, 30),
        )
        latency = int((time.time() - start) * 1000)
        throughput = 1 if latency == 0 else int(1000 / max(latency, 1))
        usage = raw.get("usage") if isinstance(raw, dict) else {}
        tokens = usage.get("total_tokens") or usage.get("prompt_tokens") or 0
        return {"latency": latency, "throughput": throughput, "tokens": tokens}
    except Exception:
        return {"latency": -1, "throughput": 0, "tokens": 0}


async def get_model_status() -> dict:
    return default_llm.model_status()


async def test_model() -> dict:
    prompt = "Reply with exactly one short sentence confirming LM Studio is connected."
    messages = [
        {"role": "system", "content": "You are a concise diagnostic assistant."},
        {"role": "user", "content": prompt},
    ]
    start = time.time()
    try:
        text = default_llm.generate_text(messages, max_tokens=80, timeout=settings.ai_request_timeout)
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
