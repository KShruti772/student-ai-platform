"""
Explainer Agent

Purpose:
- Explain why code or design choices were made, and provide debugging steps.
"""
from pathlib import Path
from typing import Dict, Any
from local_ai.llm_client import default_llm
from utils.helpers import extract_text_from_llm_response


PROMPT_PATH = Path(__file__).parents[1] / "prompts" / "explainer_prompt.txt"


class ExplainerAgent:
    def __init__(self, llm=default_llm):
        self.llm = llm
        self.system_prompt = self._load_prompt()

    def _load_prompt(self) -> str:
        try:
            return PROMPT_PATH.read_text(encoding="utf-8")
        except FileNotFoundError:
            return "You are an explainer that justifies algorithms and provides debugging tips."

    def generate(self, question: str, context: Dict[str, Any] = None) -> str:
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": question},
        ]
        resp = self.llm.generate_response(messages)
        return extract_text_from_llm_response(resp)
