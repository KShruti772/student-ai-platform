"""
Tests for workflow orchestrator.

These tests use a mock LLM that returns predictable JSON so we can verify
that orchestrator records stages and stores outputs in session memory.
"""
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
