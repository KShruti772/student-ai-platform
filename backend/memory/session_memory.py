"""
Very small session memory utility.

Purpose:
- Store recent chat history for a learning session.
- Keep API simple: add_message, get_history, clear.

Why memory matters:
- Memory provides context between turns so agents can teach progressively.
"""
from typing import Any, List, Dict
import json
import os
from utils.logger import get_logger

logger = get_logger(__name__)


class SessionMemory:
    """
    Simple session memory supporting multiple sessions.

    Purpose:
    - Store short-term conversation history to maintain context between turns.
    - Provide simple persistence to disk for local development.

    Note on memory types:
    - Short-term memory: recent messages used for immediate context (this class)
    - Long-term memory: would store summaries, student progress, and facts in a DB
      (not implemented here, but this class is a compact place to extend later).
    """

    def __init__(self, session_id: str = "default"):
        self.session_id = session_id
        self.messages: List[Dict[str, str]] = []
        # Persist path kept local to project for easy inspection by students
        self._persist_path = os.path.join(os.getcwd(), f"session_{session_id}.json")
        # Structured storage for workflow artifacts
        self.plans: List[Dict[str, str]] = []
        self.code_files: Dict[str, str] = {}
        self.explanations: List[Dict[str, str]] = []
        self.debug_context: List[Dict[str, str]] = []

    def add_message(self, role: str, content: str):
        """Add a message to the session memory.

        role: 'user' | 'assistant' | custom tags
        content: textual content or small JSON string
        """
        self.messages.append({"role": role, "content": content})

    def get_history(self) -> List[Dict[str, str]]:
        """Return stored message history for prompt composition."""
        return self.messages

    def clear_memory(self):
        """Clear the in-memory message buffer (does not delete persisted file)."""
        self.messages = []
        self.plans = []
        self.code_files = {}
        self.explanations = []
        self.debug_context = []

    def save(self):
        """Persist the current session to a JSON file for simple local storage."""
        try:
            payload = {
                "messages": self.messages,
                "plans": self.plans,
                "code_files": self.code_files,
                "explanations": self.explanations,
                "debug_context": self.debug_context,
            }
            with open(self._persist_path, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2)
            logger.info("Saved session memory to %s", self._persist_path)
        except Exception:
            logger.exception("Failed to save session memory")

    def load(self):
        """Load persisted session messages if present."""
        if not os.path.exists(self._persist_path):
            return
        try:
            with open(self._persist_path, "r", encoding="utf-8") as f:
                payload = json.load(f)
                # Backwards compatibility: older files may be list/messages only
                if isinstance(payload, list):
                    self.messages = payload
                else:
                    self.messages = payload.get("messages", [])
                    self.plans = payload.get("plans", [])
                    self.code_files = payload.get("code_files", {})
                    self.explanations = payload.get("explanations", [])
                    self.debug_context = payload.get("debug_context", [])
            logger.info("Loaded session memory from %s", self._persist_path)
        except Exception:
            logger.exception("Failed to load session memory")

    # Structured accessors for workflow artifacts
    def add_plan(self, plan: Dict[str, str]):
        self.plans.append(plan)

    def add_code(self, filename: str, content: str):
        self.code_files[filename] = content

    def add_explanation(self, explanation: Dict[str, str]):
        self.explanations.append(explanation)

    def add_debug_context(self, debug_info: Dict[str, str]):
        self.debug_context.append(debug_info)

    def get_state(self) -> Dict[str, Any]:
        return {
            "messages": self.messages,
            "plans": self.plans,
            "code_files": self.code_files,
            "explanations": self.explanations,
            "debug_context": self.debug_context,
        }

