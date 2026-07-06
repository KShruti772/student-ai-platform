"""Mentor Agent: explains decisions in student-friendly language"""
from typing import Dict, Any
from .base_agent import BaseAgent
from .logger import get_logger

_LOG = get_logger(__name__)


class MentorAgent(BaseAgent):
    def __init__(self):
        super().__init__("MentorAgent")

    async def handle(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        topic = payload.get("topic") or payload.get("decision") or payload.get("code")
        depth = payload.get("depth", "explain_like_im_12")
        if not topic:
            return {"error": "no_topic"}
        # Produce structured teaching: summary, reasoning, step-by-step, references
        summary = f"I'll explain: {str(topic)[:200]}"
        reasoning = "I chose this because it is simple, common in educational projects, and demonstrates key concepts."
        steps = [
            "High-level idea: what this component does",
            "Detailed steps: how it works",
            "Example: small code snippet or analogy",
        ]
        return {"topic": topic, "summary": summary, "reasoning": reasoning, "steps": steps, "depth": depth}
