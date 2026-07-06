"""
Mentor Agent

This module implements a production-ready MentorAgent designed to be
educational and extendable. It separates responsibilities so students can
understand how prompts, memory and model calls interact.

Key methods:
- `build_prompt`: compose the final prompt from system prompt + history + question
- `generate_response`: call the local LLM and parse structured replies
- `explain_concept`: helper to ask the model to explain a concept
- `explain_code`: helper to ask the model to explain code samples
- `mentor_reply`: top-level entrypoint that uses memory and returns structured output

The agent asks the model to return a JSON object with the educational sections
so the app can render them consistently to students.
"""

from pathlib import Path
from typing import Dict, Any, Optional
import json
from local_ai.llm_client import default_llm
from memory.session_memory import SessionMemory
from utils.helpers import extract_text_from_llm_response
from utils.logger import get_logger

_LOG = get_logger(__name__)
PROMPT_PATH = Path(__file__).parents[1] / "prompts" / "mentor_prompt.txt"


class MentorAgent:
    def __init__(self, llm=default_llm):
        # llm: an object exposing `generate_response(messages)`.
        # This is injected to make testing and future tool-integration easier.
        self.llm = llm
        self.system_prompt = self._load_prompt()

    def _load_prompt(self) -> str:
        try:
            return PROMPT_PATH.read_text(encoding="utf-8")
        except FileNotFoundError:
            return (
                "You are a helpful, patient AI mentor. Explain concepts simply and teach why."
            )

    def build_prompt(self, question: str, history: Optional[list] = None) -> list:
        """
        Compose the OpenAI-compatible `messages` sequence using:
        - system prompt (defines mentor personality and JSON output schema)
        - conversation history (short-term memory)
        - current student question

        Why this method exists:
        - Centralizes prompt composition so token-budgeting and ordering are consistent
        - Makes it easy to add token/window management later
        """
        messages = [{"role": "system", "content": self.system_prompt}]
        # Append short-term history so the model has context of prior turns
        if history:
            for msg in history:
                # history items are dicts with role/content
                messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})

        # Request structured JSON output with educational sections
        instruction = (
            "Given the student question, produce a JSON object with the following keys:"
            " `simple`, `technical`, `why`, `analogy`, `best_practices`, `common_mistakes`, `learning_points`."
            " Keep each field short and beginner-friendly. If code is included, provide short examples."
        )

        messages.append({"role": "user", "content": f"{instruction}\nQuestion: {question}"})
        return messages

    def generate_response(self, messages: list, timeout: int = 15) -> Dict[str, Any]:
        """
        Call the local LLM and return a parsed dictionary. Expected model output is JSON.

        This method exists so we can centralize error handling, timeouts and parsing.
        """
        _LOG.info("MentorAgent calling LLM with %d messages", len(messages))
        raw = self.llm.generate_response(messages, timeout=timeout)
        text = extract_text_from_llm_response(raw)

        if not text:
            _LOG.error("Empty response from LLM: %s", raw)
            return {"error": "empty_response", "raw": raw}

        # Try to parse JSON output from the model. Many systems can be guided to emit
        # a JSON blob — if parsing fails, return the raw text under `raw`.
        try:
            parsed = json.loads(text)
            _LOG.info("Parsed JSON response from LLM")
            return parsed
        except Exception:
            _LOG.warning("Could not parse JSON from LLM output; returning raw text")
            return {"raw": text}

    def explain_concept(self, concept: str, session: Optional[SessionMemory] = None) -> Dict[str, Any]:
        """
        Convenience wrapper to explain a concept using conversation memory.

        - Builds prompt
        - Calls the model
        - Optionally records the exchange in session memory
        """
        history = session.get_history() if session else None
        messages = self.build_prompt(concept, history)
        result = self.generate_response(messages)
        if session:
            session.add_message("user", concept)
            session.add_message("assistant", json.dumps(result))
            session.save()
        return result

    def explain_code(self, code_snippet: str, session: Optional[SessionMemory] = None) -> Dict[str, Any]:
        """
        Ask the mentor to explain a code snippet. The system prompt asks the model
        to include short examples and debugging tips.
        """
        question = f"Please explain the following code and point out bugs or improvements:\n{code_snippet}"
        return self.explain_concept(question, session)

    def mentor_reply(self, question: str, session: Optional[SessionMemory] = None) -> Dict[str, Any]:
        """
        Top-level method students and API endpoints call.

        Steps:
        1. Load short-term history from `session` if provided
        2. Build a structured prompt
        3. Call the LLM and parse JSON
        4. Save the assistant reply to session memory

        Returns a dict with the educational sections or a fallback `raw` field.
        """
        history = session.get_history() if session else None
        messages = self.build_prompt(question, history)
        response = self.generate_response(messages)

        # Persist the conversation for continuity
        if session:
            session.add_message("user", question)
            # store the raw assistant message so future prompts include it
            session.add_message("assistant", json.dumps(response if isinstance(response, dict) else {"raw": response}))
            session.save()

        return response

    def explain_skill_selection(self, question: str, selected_skills: list, selected_tools: list) -> Dict[str, Any]:
        """
        Provide a human-friendly explanation of why certain skills and tools
        were chosen to address the student's question. Returns a short JSON
        summarizing the rationale, tool list, and next steps.
        """
        why = (
            f"Based on the question, the system selected the following skills: {', '.join(selected_skills)}. "
            f"These help by focusing the assistant on domain-relevant templates and examples."
        )
        tools = (
            f"Planned tools: {', '.join(selected_tools)}. "
            "These tools enable reading/writing code, running commands, and inspecting repositories locally."
        )
        guidance = (
            "Next steps: the assistant will load minimal skill instructions, inject them into prompts, "
            "and only call tools when asked explicitly or when a deterministic action is required."
        )
        return {"why": why, "tools": tools, "guidance": guidance}

