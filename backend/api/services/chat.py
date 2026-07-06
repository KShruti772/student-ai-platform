from dataclasses import dataclass
from local_ai.llm_client import default_llm
from config.settings import settings
from utils.logger import get_logger
import asyncio
import time
import uuid

logger = get_logger(__name__)


@dataclass
class ChatServiceResult:
    response: str | None = None
    error: str | None = None
    debug: dict | None = None
    meta: dict | None = None


async def send_chat(message: str, session_id: str = "default", event_bus=None, persistent=None) -> ChatServiceResult:
    """Send message to LM Studio and stream tokens to event_bus if provided.

    Persists every chunk and final assembled response via `persistent` if provided.
    Returns the aggregated full response text when complete.
    """
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": message},
    ]

    loop = asyncio.get_running_loop()
    stream_id = str(uuid.uuid4())
    start_ts = time.time()

    def _generate_sync():
        try:
            text = default_llm.generate_text(messages, timeout=settings.ai_request_timeout)
        except Exception as e:
            logger.exception("LLM request error: %s", e)
            raise
        full_text = text.strip()
        if not full_text:
            raise RuntimeError("Model returned an empty response")
        return full_text, max(1, len(full_text.split()))

    try:
        resp_text, tokens = await loop.run_in_executor(None, _generate_sync)
        latency_ms = int((time.time() - start_ts) * 1000)
        result = {
            "content": resp_text,
            "tokens": tokens,
            "latency_ms": latency_ms,
            "model": getattr(default_llm, "model_name", "local_model"),
            "session_id": session_id,
            "stream_id": stream_id,
        }
        token_event = {
            "type": "token_stream",
            "stream_id": stream_id,
            "session_id": session_id,
            "token": resp_text,
            "ts": int(time.time() * 1000),
        }
        if event_bus is not None:
            try:
                await event_bus.publish(token_event)
            except Exception:
                logger.exception("Failed to publish token event")
        if persistent is not None:
            try:
                await persistent.append_stream_chunk(session_id, token_event)
            except Exception:
                logger.exception("Failed to persist token chunk")
        # persist final assembled response
        if persistent is not None:
            try:
                await persistent.finalize_response(session_id, result)
            except Exception:
                logger.exception("Failed to persist final response")
        # emit finished event
        if event_bus is not None:
            try:
                await event_bus.publish({"type": "agent_finished", "session_id": session_id, "stream_id": stream_id, "payload": result})
            except Exception:
                logger.exception("Failed to publish finished event")
        # record token usage
        if persistent is not None:
            try:
                await persistent.record_token_usage(session_id, result.get("model", "unknown"), tokens)
            except Exception:
                logger.exception("Failed to record token usage")

        return ChatServiceResult(response=resp_text, meta=result)
    except Exception as e:
        logger.exception("send_chat failed: %s", e)
        raw_error = str(e)
        if event_bus is not None:
            try:
                await event_bus.publish({"type": "error", "session_id": session_id, "error": raw_error})
            except Exception:
                pass
        if "timed out" in raw_error.lower() or "timeout" in raw_error.lower():
            friendly = "LM Studio took too long to respond. Please try again with a shorter prompt or verify the loaded model is responsive."
        else:
            friendly = "LM Studio could not generate a response. Check that the configured model is loaded and try again."
        return ChatServiceResult(
            error=friendly,
            debug={
                "raw_error": raw_error,
                "provider": settings.model_provider,
                "base_url": settings.openai_base_url,
                "model": settings.model_name,
            },
        )
