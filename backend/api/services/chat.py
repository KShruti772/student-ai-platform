from dataclasses import dataclass
from local_ai.model_manager import model_manager
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

    stream_id = str(uuid.uuid4())
    start_ts = time.time()

    try:
        resp_text = (await model_manager.generate_text(messages, timeout=settings.ai_request_timeout)).strip()
        if not resp_text:
            raise RuntimeError("Model returned an empty response")
        tokens = max(1, len(resp_text.split()))
        latency_ms = int((time.time() - start_ts) * 1000)
        result = {
            "content": resp_text,
            "tokens": tokens,
            "latency_ms": latency_ms,
            "model": settings.model_name,
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
            friendly = "AI temporarily unavailable. Core application is still usable. Check that LM Studio is running and the configured model is loaded."
        return ChatServiceResult(
            error=friendly,
            debug={
                "raw_error": raw_error,
                "provider": settings.model_provider,
                "base_url": settings.openai_base_url,
                "model": settings.model_name,
            },
        )
