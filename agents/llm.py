"""Local LLM wrapper used by agents.

Abstracts access to `local_ai.llm_client.default_llm` (LM Studio / Ollama)
and provides sync/async helpers including a simple streaming generator.
"""
from typing import Optional, AsyncGenerator, Dict, Any
import importlib
from .logger import get_logger

_LOG = get_logger(__name__)


def _get_llm():
    try:
        mod = importlib.import_module('local_ai.llm_client')
        return getattr(mod, 'default_llm')
    except Exception:
        _LOG.warning('local LLM client not available')
        return None


class LocalLLM:
    def __init__(self):
        self._llm = _get_llm()

    def available(self) -> bool:
        return self._llm is not None

    def generate(self, prompt: str, **kwargs) -> str:
        if not self._llm:
            return f"[local-llm-unavailable] {prompt[:200]}"
        return self._llm.generate_response(prompt, **kwargs)

    async def stream_generate(self, prompt: str, **kwargs) -> AsyncGenerator[str, None]:
        """Yield tokens/partial strings if the LLM supports streaming.

        Fallback: yield the full response once.
        """
        if not self._llm:
            yield f"[local-llm-unavailable] {prompt[:200]}"
            return
        # try to use a stream interface if available
        if hasattr(self._llm, 'stream_response'):
            async for chunk in self._llm.stream_response(prompt, **kwargs):
                yield chunk
            return
        # fallback: single full response
        resp = self._llm.generate_response(prompt, **kwargs)
        yield resp
