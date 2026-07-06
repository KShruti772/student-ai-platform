"""
Tests for MentorAgent behavior.

These tests avoid calling a real LLM by injecting a mock LLM client that
returns predictable JSON. They verify prompt building, response parsing,
and session memory integration.
"""
import json
from agents.mentor_agent import MentorAgent
from memory.session_memory import SessionMemory


class MockLLM:
    def generate_response(self, messages, timeout=15):
        # Return a fake model response in the OpenAI-compatible shape
        payload = {
            "simple": "Simple explanation",
            "technical": "Technical details",
            "why": "Because it's useful",
            "analogy": "Like a teacher",
            "best_practices": ["practice"],
            "common_mistakes": ["overfitting"],
            "learning_points": ["try a small project"]
        }
        content = json.dumps(payload)
        return {"choices": [{"message": {"content": content}}]}


def test_build_prompt_and_parse():
    mock = MockLLM()
    agent = MentorAgent(llm=mock)
    session = SessionMemory(session_id="test1")
    session.clear_memory()

    res = agent.mentor_reply("What is machine learning?", session=session)
    assert isinstance(res, dict)
    assert res.get("simple") == "Simple explanation"
    assert "technical" in res


def test_session_memory_persistence():
    mock = MockLLM()
    agent = MentorAgent(llm=mock)
    session = SessionMemory(session_id="test2")
    session.clear_memory()
    # ensure no file exists or is empty
    out = agent.mentor_reply("Explain regression", session=session)
    # history should now include two messages (user + assistant)
    history = session.get_history()
    assert any(m.get("role") == "user" for m in history)
    assert any(m.get("role") == "assistant" for m in history)
