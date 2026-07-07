"""
Tests for workflow orchestrator.

These tests use a mock LLM that returns predictable JSON so we can verify
that orchestrator records stages and stores outputs in session memory.
"""
import asyncio

from fastapi.testclient import TestClient

from app import app
from workflows.agent_orchestrator import AgentOrchestrator
from memory.session_memory import SessionMemory


class MockLLM:
    def generate_response(self, messages, timeout=15):
        # Return a generic JSON for all agents
        return {"choices": [{"message": {"content": '{"simple":"ok","files": {"main.py":"print(\"hi\")"}, "issues": []}'}}]}


def test_run_project_build():
    # Create orchestrator and inject mock LLM into each agent instance
    orch = AgentOrchestrator()
    orch.planner.llm = MockLLM()
    orch.architect.llm = MockLLM()
    orch.research.llm = MockLLM()
    orch.coder.llm = MockLLM()
    orch.reviewer.llm = MockLLM()
    orch.debugger.llm = MockLLM()
    orch.explainer.llm = MockLLM()
    orch.mentor.llm = MockLLM()
    orch.executor.llm = MockLLM()

    session = SessionMemory(session_id="wf_test")
    session.clear_memory()
    out = orch.run_project_build("Build a simple ML app", session)
    assert "workflow_state" in out
    assert "plan" in out
    assert isinstance(out.get("code_files"), dict)


def test_get_workflow_returns_valid_response_shape():
    client = TestClient(app)
    response = client.get("/api/workflow")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert isinstance(data.get("nodes"), list)
    assert isinstance(data.get("edges"), list)
    assert data.get("status") == "idle"
    assert data.get("progress") == 0


def test_get_workflow_falls_back_to_default_on_error(monkeypatch):
    import api.services.workflow as workflow_service
    import api.services.workflow_runner as workflow_runner

    def boom():
        raise RuntimeError("simulated failure")

    monkeypatch.setattr(workflow_runner, "default_graph", boom)

    data = asyncio.run(workflow_service.get_workflow())

    assert data["nodes"] == []
    assert data["edges"] == []
    assert data["status"] == "idle"
    assert data["progress"] == 0
