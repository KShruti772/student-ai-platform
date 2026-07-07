"""Lazy local model manager for LM Studio-compatible APIs."""
from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field
from typing import Any

import httpx

from config.settings import settings
from utils.logger import get_logger

_LOG = get_logger(__name__)


@dataclass
class ModelRuntimeStatus:
    lmstudio: str = "loading"
    configured_model: str = settings.model_name
    loaded_models: list[str] = field(default_factory=list)
    model_ready: bool = False
    latency_ms: int | None = None
    context_size: int | None = None
    gpu: str | None = None
    error: str | None = None
    checked_at: float | None = None


class ModelManager:
    """A singleton-style manager that never loads or probes AI during import/startup."""

    def __init__(self) -> None:
        self.base_url = settings.openai_base_url.rstrip("/")
        self.model_name = settings.model_name
        self._status = ModelRuntimeStatus()
        self._lock = asyncio.Lock()

    def status(self) -> dict[str, Any]:
        return {
            "lmstudio": self._status.lmstudio,
            "configured_model": self._status.configured_model,
            "loaded_models": list(self._status.loaded_models),
            "model_ready": self._status.model_ready,
            "latency_ms": self._status.latency_ms,
            "context_size": self._status.context_size,
            "gpu": self._status.gpu,
            "error": self._status.error,
            "checked_at": self._status.checked_at,
            "base_url": self.base_url,
        }

    async def refresh_status(self, timeout: float = 2.0) -> dict[str, Any]:
        started = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(timeout)) as client:
                response = await client.get(f"{self.base_url}/models", headers=self._headers())
                response.raise_for_status()
                payload = response.json()
        except httpx.TimeoutException as exc:
            await self._set_offline(f"LM Studio status check timed out after {timeout:g}s", started)
            _LOG.warning("Timeout checking LM Studio: %s", exc)
            return self.status()
        except httpx.HTTPError as exc:
            await self._set_offline(str(exc), started)
            _LOG.warning("LM Studio status check failed: %s", exc)
            return self.status()
        except Exception as exc:
            await self._set_offline(str(exc), started)
            _LOG.warning("Unexpected LM Studio status error: %s", exc)
            return self.status()

        models = payload.get("data", []) if isinstance(payload, dict) else []
        model_items = [item for item in models if isinstance(item, dict)]
        model_ids = [str(item.get("id")) for item in model_items if item.get("id")]
        matched = next((item for item in model_items if item.get("id") == self.model_name), None)
        first = matched or (model_items[0] if model_items else {})
        context_size = first.get("context_length") or first.get("contextLength") or first.get("n_ctx") if isinstance(first, dict) else None

        async with self._lock:
            self._status = ModelRuntimeStatus(
                lmstudio="online",
                configured_model=self.model_name,
                loaded_models=model_ids,
                model_ready=self.model_name in model_ids,
                latency_ms=int((time.perf_counter() - started) * 1000),
                context_size=context_size,
                gpu=first.get("gpu") if isinstance(first, dict) else None,
                error=None if model_ids else "LM Studio is online but no model is loaded.",
                checked_at=time.time(),
            )
        if self._status.model_ready:
            _LOG.info("LM Studio Connected model=%s latency_ms=%s", self.model_name, self._status.latency_ms)
        else:
            _LOG.warning("LM Studio Connected but configured model is not loaded configured=%s loaded=%s", self.model_name, model_ids)
        return self.status()

    async def generate_text(
        self,
        messages: list[dict[str, str]] | str,
        *,
        temperature: float = settings.temperature,
        max_tokens: int = settings.max_tokens,
        timeout: float = settings.ai_request_timeout,
        retries: int = 3,
    ) -> str:
        if isinstance(messages, str):
            messages = [{"role": "user", "content": messages}]
        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False,
        }
        last_error: str | None = None
        for attempt in range(1, retries + 1):
            try:
                async with httpx.AsyncClient(timeout=httpx.Timeout(timeout)) as client:
                    response = await client.post(f"{self.base_url}/chat/completions", json=payload, headers=self._headers())
                    response.raise_for_status()
                    data = response.json()
                text = data["choices"][0]["message"]["content"]
                await self.refresh_status(timeout=2.0)
                return str(text)
            except httpx.TimeoutException:
                last_error = "Model request timed out."
                _LOG.warning("Timeout during model request attempt=%s/%s", attempt, retries)
            except httpx.HTTPError as exc:
                last_error = str(exc)
                _LOG.warning("HTTP error during model request attempt=%s/%s error=%s", attempt, retries, exc)
            except Exception as exc:
                last_error = str(exc)
                _LOG.warning("Model request failed attempt=%s/%s error=%s", attempt, retries, exc)
            await self.refresh_status(timeout=2.0)
            if attempt < retries:
                await asyncio.sleep(min(2 ** (attempt - 1), 3))
        raise RuntimeError(last_error or "AI temporarily unavailable. Core application is still usable.")

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json",
        }

    async def _set_offline(self, error: str, started: float) -> None:
        async with self._lock:
            self._status = ModelRuntimeStatus(
                lmstudio="offline",
                configured_model=self.model_name,
                loaded_models=[],
                model_ready=False,
                latency_ms=int((time.perf_counter() - started) * 1000),
                error=error,
                checked_at=time.time(),
            )


model_manager = ModelManager()


def list_available_models() -> list[str]:
    status = model_manager.status()
    return status["loaded_models"] or [settings.model_name]


def get_active_model() -> str:
    return settings.model_name
