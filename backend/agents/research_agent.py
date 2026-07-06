"""
Research Agent

Uses the local RAG pipeline to retrieve relevant context for a query and
returns concise summaries students can read and use in follow-up tasks.
"""
from typing import Dict, Any
from agents.base_agent import BaseAgent
from rag.retrieve import retrieve_context
from utils.logger import get_logger

_LOG = get_logger(__name__)


class ResearchAgent(BaseAgent):
    name = "research"

    def __init__(self):
        super().__init__()

    def search(self, collection: str, query: str, top_k: int = 5) -> Dict[str, Any]:
        _LOG.info("ResearchAgent searching collection=%s query=%s", collection, query)
        res = retrieve_context(collection, query, top_k=top_k)
        return {"result": res}

    def run_task(self, task: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        if task.get("type") == "search":
            return self.search(task.get("collection", "default"), task.get("query", ""), task.get("top_k", 5))
        return {"error": "unsupported_task"}
"""
Research Agent

Purpose:
- Explain technologies, compare frameworks, and recommend experiments.

Design:
- Loads prompt from prompts/research_prompt.txt and uses the LLM client.
"""
from pathlib import Path
from typing import Dict, Any, Optional
import json
from local_ai.llm_client import default_llm
from utils.helpers import extract_text_from_llm_response
from utils.logger import get_logger

_LOG = get_logger(__name__)
PROMPT_PATH = Path(__file__).parents[1] / "prompts" / "research_prompt.txt"


class ResearchAgent:
    def __init__(self, llm=default_llm):
        self.llm = llm
        try:
            self.system_prompt = PROMPT_PATH.read_text(encoding="utf-8")
        except FileNotFoundError:
            self.system_prompt = "You are a research agent that explains technologies clearly."

    def generate(self, topic: str) -> Dict[str, Any]:
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": topic},
        ]
        raw = self.llm.generate_response(messages)
        text = extract_text_from_llm_response(raw)
        try:
            return json.loads(text)
        except Exception:
            _LOG.warning("ResearchAgent: returning raw text due to JSON parse failure")
            return {"raw": text}
