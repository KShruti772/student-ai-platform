import time

from fastapi.testclient import TestClient

from app import app
from api.services import system_runtime


def test_system_status_is_fast_and_cached():
    client = TestClient(app)
    started = time.perf_counter()
    response = client.get("/api/system/status")
    elapsed_ms = (time.perf_counter() - started) * 1000

    assert response.status_code == 200
    assert elapsed_ms < 100
    data = response.json()
    assert data["backend"] == "online"
    assert data["lmstudio"] in {"loading", "online", "offline"}
    assert data["model"]
    assert "services" in data


def test_diagnostics_handles_lmstudio_unavailable(monkeypatch):
    async def fake_refresh_status(timeout=2.0):
        return {
            "lmstudio": "offline",
            "configured_model": "qwen2.5-coder-7b-instruct",
            "loaded_models": [],
            "model_ready": False,
            "latency_ms": 3,
            "context_size": None,
            "gpu": None,
            "error": "Connection refused",
            "checked_at": time.time(),
            "base_url": "http://127.0.0.1:1234/v1",
        }

    monkeypatch.setattr(system_runtime.model_manager, "refresh_status", fake_refresh_status)
    client = TestClient(app)
    response = client.get("/api/system/diagnostics")

    assert response.status_code == 200
    data = response.json()
    assert data["backend"]["status"] == "online"
    assert data["lmstudio"]["status"] == "offline"
    assert data["model"]["ready"] is False


def test_inference_test_handles_timeout(monkeypatch):
    async def fake_generate_text(*args, **kwargs):
        raise RuntimeError("timeout")

    monkeypatch.setattr(system_runtime.model_manager, "generate_text", fake_generate_text)
    client = TestClient(app)
    response = client.post("/api/system/inference-test")

    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is False
    assert data["inference"]["status"] == "timeout"
