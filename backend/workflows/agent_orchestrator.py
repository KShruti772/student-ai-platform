"""
Agent Orchestrator

Purpose:
- Coordinate planner, research, coding, reviewer, debugger, explainer, and mentor agents
- Maintain workflow state and explain which agent did what

Design:
- Linear, educational pipeline for clarity. Each step's output is recorded in shared session memory.
"""
import time
from typing import Dict, Any
from utils.logger import get_logger
from agents.planner_agent import PlannerAgent
from agents.research_agent import ResearchAgent
from agents.coding_agent import CodingAgent
from agents.reviewer_agent import ReviewerAgent
from agents.debugger_agent import DebuggerAgent
from agents.explainer_agent import ExplainerAgent
from agents.mentor_agent import MentorAgent
from agents.architect_agent import ArchitectAgent
from agents.execution_agent import ExecutionAgent

_LOG = get_logger(__name__)


class AgentOrchestrator:
    def __init__(self):
        self.planner = PlannerAgent()
        self.architect = ArchitectAgent()
        self.research = ResearchAgent()
        self.coder = CodingAgent()
        self.reviewer = ReviewerAgent()
        self.debugger = DebuggerAgent()
        self.explainer = ExplainerAgent()
        self.mentor = MentorAgent()
        self.executor = ExecutionAgent()

    def _record_stage(self, session, stage_name: str, agent_name: str, output: Dict[str, Any]):
        session.add_message("system", f"stage:{stage_name} agent:{agent_name}")
        session.add_message("assistant", str(output))
        _LOG.info("Recorded stage %s by %s", stage_name, agent_name)

    def run_project_build(self, goal: str, session) -> Dict[str, Any]:
        """
        High-level pipeline to produce a student project scaffold.

        Stages:
        1) Planner -> plan
        2) Research -> tech/context
        3) Coding -> code files
        4) Reviewer -> review
        5) Debugger (conditional) -> fixes
        6) Explainer -> explanations
        7) Mentor -> educational wrap-up
        """
        workflow_state = {
            "goal": goal,
            "stages": [],
            "errors": [],
            "start_time": time.time(),
        }
        plan = ""
        architect_out = ""
        research_out = ""
        code_out = {}
        review_out = {}
        debug_out = None
        explain_out = {}
        mentor_out = {}

        # Planner
        stage = "planner"
        try:
            plan = self.planner.generate(goal)
            session.add_plan({"goal": goal, "plan": plan})
            self._record_stage(session, stage, "PlannerAgent", {"plan": plan})
            workflow_state["stages"].append({"stage": stage, "agent": "planner", "ok": True})
        except Exception as e:
            _LOG.exception("Planner failed")
            workflow_state["errors"].append({"stage": stage, "error": str(e)})
            plan = goal


        # Architect: convert plan to architecture
        stage = "architect"
        try:
            architect_out = self.architect.design(plan if isinstance(plan, str) else str(plan))
            session.add_plan({"goal": goal, "plan": plan, "architecture": architect_out})
            self._record_stage(session, stage, "ArchitectAgent", architect_out)
            workflow_state["stages"].append({"stage": stage, "agent": "architect", "ok": True})
        except Exception as e:
            _LOG.exception("Architect failed")
            workflow_state["errors"].append({"stage": stage, "error": str(e)})

        # Research (optional): gather deeper context on technologies
        stage = "research"
        try:
            research_in = architect_out if isinstance(architect_out, str) else str(architect_out)
            research_out = self.research.generate(research_in)
            session.add_explanation({"research": research_out})
            self._record_stage(session, stage, "ResearchAgent", research_out)
            workflow_state["stages"].append({"stage": stage, "agent": "research", "ok": True})
        except Exception as e:
            _LOG.exception("Research failed")
            workflow_state["errors"].append({"stage": stage, "error": str(e)})

        # Coding
        stage = "coding"
        try:
            coding_spec = f"Plan:\n{plan}\nArchitecture:\n{architect_out}\nResearch:\n{research_out}\nCreate project files and minimal runnable scaffold."
            code_out = self.coder.generate(coding_spec)
            # store code files if present
            if isinstance(code_out, dict) and code_out.get("files"):
                for fn, content in code_out.get("files", {}).items():
                    session.add_code(fn, content)
            self._record_stage(session, stage, "CodingAgent", code_out)
            workflow_state["stages"].append({"stage": stage, "agent": "coding", "ok": True})
        except Exception as e:
            _LOG.exception("Coding failed")
            workflow_state["errors"].append({"stage": stage, "error": str(e)})

        # Reviewer
        stage = "reviewer"
        try:
            # Provide concatenated code for review
            code_blob = "\n\n".join(session.code_files.values()) if session.code_files else ""
            review_out = self.reviewer.review(code_blob)
            self._record_stage(session, stage, "ReviewerAgent", review_out)
            workflow_state["stages"].append({"stage": stage, "agent": "reviewer", "ok": True})
        except Exception as e:
            _LOG.exception("Reviewer failed")
            workflow_state["errors"].append({"stage": stage, "error": str(e)})

        # Conditional Debugger: if reviewer reports high severity issues
        stage = "debugger"
        try:
            needs_debug = False
            # Simple heuristic: if reviewer returns issues with severity 'high'
            if isinstance(review_out, dict) and review_out.get("issues"):
                for it in review_out.get("issues", []):
                    if it.get("severity") == "high":
                        needs_debug = True
                        break

            debug_out = None
            if needs_debug:
                debug_out = self.debugger.analyze(str(review_out))
                session.add_debug_context({"debug": debug_out})
                self._record_stage(session, stage, "DebuggerAgent", debug_out)
            workflow_state["stages"].append({"stage": stage, "agent": "debugger", "ok": True, "ran": needs_debug})
        except Exception as e:
            _LOG.exception("Debugger failed")
            workflow_state["errors"].append({"stage": stage, "error": str(e)})

        # Explainer
        stage = "explainer"
        try:
            explainer_in = f"Plan:\n{plan}\nReview:\n{review_out}\n"
            explain_out = self.explainer.generate(explainer_in)
            session.add_explanation({"explainer": explain_out})
            self._record_stage(session, stage, "ExplainerAgent", explain_out)
            workflow_state["stages"].append({"stage": stage, "agent": "explainer", "ok": True})
        except Exception as e:
            _LOG.exception("Explainer failed")
            workflow_state["errors"].append({"stage": stage, "error": str(e)})

        # Execution (simulate running key files/tests)
        stage = "execution"
        try:
            # For safety we simulate execution via ExecutionAgent using concatenated code
            exec_in = "\n\n".join(session.code_files.values()) if session.code_files else ""
            exec_out = self.executor.run(exec_in)
            session.add_explanation({"execution": exec_out})
            self._record_stage(session, stage, "ExecutionAgent", exec_out)
            workflow_state["stages"].append({"stage": stage, "agent": "execution", "ok": True})
        except Exception as e:
            _LOG.exception("Execution failed")
            workflow_state["errors"].append({"stage": stage, "error": str(e)})

        # Mentor wrap-up
        stage = "mentor"
        try:
            mentor_in = f"Please produce an educational summary for the student based on the plan and explanations.\nPlan:\n{plan}\nExplainer:\n{explain_out}"
            mentor_out = self.mentor.mentor_reply(mentor_in, session)
            session.add_explanation({"mentor": mentor_out})
            self._record_stage(session, stage, "MentorAgent", mentor_out)
            workflow_state["stages"].append({"stage": stage, "agent": "mentor", "ok": True})
        except Exception as e:
            _LOG.exception("Mentor wrap-up failed")
            workflow_state["errors"].append({"stage": stage, "error": str(e)})

        workflow_state["duration"] = time.time() - workflow_state["start_time"]
        session.save()
        return {
            "workflow_state": workflow_state,
            "plan": plan,
            "code_files": session.code_files,
            "review": review_out,
            "debug": debug_out,
            "explanations": session.explanations,
            "mentor": mentor_out,
        }
