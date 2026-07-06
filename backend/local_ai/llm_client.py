"""
Simple LM client that targets a local LM Studio (OpenAI-compatible) API.

Purpose:
- Provide a single `generate_response` function used by agents.
- Keep wrapper small and educational so students can extend it.

Notes:
- Uses OpenAI-compatible chat completions endpoint: `/chat/completions`.
- LM Studio often offers an OpenAI-compatible interface for local models.
"""
import json
from typing import List, Dict, Any
import httpx
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)


class LLMClient:
    def __init__(
        self,
        api_url: str = settings.openai_base_url,
        model: str = settings.model_name,
        api_key: str = settings.openai_api_key,
    ):
        self.api_url = api_url.rstrip("/")
        self.model = model
        self.api_key = api_key

    @property
    def model_name(self) -> str:
        return self.model

    @property
    def headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def _chat_payload(
        self,
        messages: List[Dict[str, str]] | str,
        temperature: float,
        max_tokens: int,
        stream: bool,
    ) -> Dict[str, Any]:
        if isinstance(messages, str):
            messages = [{"role": "user", "content": messages}]
        return {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream,
        }

    def list_models(self, timeout: int = settings.ai_request_timeout) -> Dict[str, Any]:
        url = f"{self.api_url}/models"
        logger.info("Calling LM Studio models endpoint: %s", url)
        try:
            with httpx.Client(timeout=timeout) as client:
                resp = client.get(url, headers=self.headers)
                logger.info("LM Studio models status=%s url=%s", resp.status_code, url)
                if resp.status_code >= 400:
                    logger.error("LM Studio models error body: %s", resp.text[:1000])
                resp.raise_for_status()
                return resp.json()
        except httpx.TimeoutException:
            logger.exception("LM Studio models request timed out after %s seconds", timeout)
            return {"error": f"timeout after {timeout} seconds"}
        except httpx.HTTPError as e:
            logger.exception("LM Studio models request failed: %s", e)
            return {"error": str(e)}

    def model_status(self) -> Dict[str, Any]:
        data = self.list_models()
        models = data.get("data") if isinstance(data, dict) else []
        model_ids = [item.get("id") for item in models if isinstance(item, dict)]
        connected = not bool(isinstance(data, dict) and data.get("error"))
        return {
            "provider": settings.model_provider,
            "base_url": self.api_url,
            "model": self.model,
            "connected": connected,
            "model_loaded": self.model in model_ids,
            "available_models": model_ids,
            "error": data.get("error") if isinstance(data, dict) else None,
        }

    def generate_response(self, messages: List[Dict[str, str]] | str,
                          temperature: float = settings.temperature,
                          max_tokens: int = settings.max_tokens,
                          timeout: int = settings.ai_request_timeout) -> Dict[str, Any]:
        """
        Send messages to the local LM Studio API using OpenAI-compatible format.

        messages: list of {'role': 'system'|'user'|'assistant', 'content': str}
        Returns the raw JSON response: callers can extract text or structured output.
        """
        url = f"{self.api_url}/chat/completions"
        payload = self._chat_payload(messages, temperature, max_tokens, stream=False)

        try:
            logger.info("Calling LM API at %s with model=%s", url, self.model)
            with httpx.Client(timeout=timeout) as client:
                resp = client.post(url, json=payload, headers=self.headers)
            logger.info("LM API response status=%s url=%s", resp.status_code, url)
            if resp.status_code >= 400:
                logger.error("LM API error body: %s", resp.text[:1000])
            resp.raise_for_status()
            data = resp.json()
            return data
        except httpx.TimeoutException:
            logger.error("LM request timed out after %s seconds", timeout)
            return {"error": "timeout"}
        except httpx.HTTPError as e:
            logger.exception("LM request failed: %s", e)
            return {"error": str(e)}

    def generate_text(self, messages: List[Dict[str, str]] | str,
                      temperature: float = settings.temperature,
                      max_tokens: int = settings.max_tokens,
                      timeout: int = settings.ai_request_timeout) -> str:
        data = self.generate_response(messages, temperature=temperature, max_tokens=max_tokens, timeout=timeout)
        if data.get("error"):
            raise RuntimeError(str(data["error"]))
        try:
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            raise RuntimeError(f"Unexpected LM Studio response shape: {data}") from e

    def stream_response(self, messages: List[Dict[str, str]] | str,
                        temperature: float = settings.temperature,
                        max_tokens: int = settings.max_tokens,
                        timeout: int = settings.ai_request_timeout):
        """Stream response from an OpenAI-compatible endpoint.

        Yields text chunks as they arrive. Attempts to parse SSE-style
        `data: {json}` lines containing `choices` with `delta` text.
        Falls back to line-based streaming if format differs.
        """
        url = f"{self.api_url}/chat/completions"
        payload = self._chat_payload(messages, temperature, max_tokens, stream=True)
        try:
            logger.info("Starting streamed LM request to %s", url)
            cumulative = ""
            token_index = 0
            with httpx.Client(timeout=timeout) as client:
                with client.stream("POST", url, json=payload, headers=self.headers) as resp:
                    logger.info("Streamed LM API response status=%s url=%s", resp.status_code, url)
                    if resp.status_code >= 400:
                        body = resp.read().decode("utf-8", errors="replace")[:1000]
                        logger.error("Streamed LM API error body: %s", body)
                        yield {"type": "error", "error": f"{resp.status_code} response from model API at {url}: {body}"}
                        return
                    resp.raise_for_status()
                    for raw in resp.iter_lines():
                        if raw is None:
                            continue
                        line = raw.strip()
                        if not line:
                            continue
                        # Typical SSE chunk: 'data: {...}'
                        if line.startswith("data:"):
                            data = line[len("data:"):].strip()
                            if data == "[DONE]":
                                break
                            # Try to parse OpenAI-style delta messages
                            try:
                                j = json.loads(data)
                                choices = j.get("choices") or []
                                if choices:
                                    first = choices[0]
                                    # delta (streaming) format
                                    delta = first.get("delta")
                                    if isinstance(delta, dict):
                                        txt = delta.get("content")
                                        role = delta.get("role")
                                        if txt:
                                            cumulative += txt
                                            yield {"type": "token", "text": txt, "role": role, "index": token_index, "cumulative": cumulative}
                                            token_index += 1
                                            continue
                                    # chat completions full message
                                    msg = first.get("message") or {}
                                    if isinstance(msg, dict):
                                        txt = msg.get("content")
                                        role = msg.get("role")
                                        if txt:
                                            cumulative += txt
                                            yield {"type": "token", "text": txt, "role": role, "index": token_index, "cumulative": cumulative}
                                            token_index += 1
                                            continue
                            except Exception:
                                # not JSON; yield raw chunk
                                cumulative += data
                                yield {"type": "token", "text": data, "index": token_index, "cumulative": cumulative}
                                token_index += 1
                        else:
                            # non-SSE line: try to parse as JSON or yield text
                            try:
                                j = json.loads(line)
                                choices = j.get("choices") or []
                                if choices:
                                    first = choices[0]
                                    msg = first.get("message") or {}
                                    if isinstance(msg, dict):
                                        txt = msg.get("content")
                                        role = msg.get("role")
                                        if txt:
                                            cumulative += txt
                                            yield {"type": "token", "text": txt, "role": role, "index": token_index, "cumulative": cumulative}
                                            token_index += 1
                                            continue
                            except Exception:
                                cumulative += line
                                yield {"type": "token", "text": line, "index": token_index, "cumulative": cumulative}
                                token_index += 1
        except httpx.TimeoutException:
            logger.exception("Streamed LM request timed out after %s seconds", timeout)
            yield {"type": "error", "error": f"Model request timed out after {timeout} seconds at {url}"}
        except httpx.HTTPError as e:
            logger.exception("Streamed LM request failed: %s", e)
            yield {"type": "error", "error": str(e)}


# Provide a default client instance for easy imports in examples and small scripts
default_llm = LLMClient()
