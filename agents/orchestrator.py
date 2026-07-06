"""Orchestrator: coordinates multi-agent workflows.

Receives a user prompt, asks PlannerAgent for a plan, dispatches steps to the
appropriate agents, gathers results, stores plan+results in MemoryAgent, and
emits structured traces for explainability and teaching.
"""
import asyncio
from typing import Dict, Any, List, Optional, Callable
from .planner_agent import PlannerAgent
from .research_agent import ResearchAgent
from .coding_agent import CodingAgent
from .reviewer_agent import ReviewerAgent
from .memory_agent import MemoryAgent
from .mentor_agent import MentorAgent
from .llm import LocalLLM
from .message_bus import bus
from .logger import get_logger

_LOG = get_logger(__name__)


class Orchestrator:
    def __init__(self, headless: bool = True):
        self.llm = LocalLLM()
        self.planner = PlannerAgent(self.llm)
        self.research = ResearchAgent(headless=headless)
        self.coding = CodingAgent(self.llm)
        self.reviewer = ReviewerAgent()
        self.mentor = MentorAgent()
        self.memory = MemoryAgent()

    async def run(self, user_prompt: str, explain: bool = True, stream_cb: Optional[Callable] = None) -> Dict[str, Any]:
        """Main entry: plan and run steps. `stream_cb` gets incremental updates.

        Returns final aggregated report with agent traces.
        """
        await maybe_call(stream_cb, {'phase': 'planning'})
        plan_res = await self.planner.run({'prompt': user_prompt})
        plan = plan_res.get('result', {}).get('plan') or plan_res.get('result') or []
        trace = {'user_prompt': user_prompt, 'plan': plan, 'steps': []}
        self.memory.add_plan({'prompt': user_prompt, 'plan': plan})

        for step in plan:
            agent_name = step.get('agent')
            desc = step.get('description')
            await maybe_call(stream_cb, {'phase': 'step_start', 'agent': agent_name, 'description': desc})
            if agent_name == 'research':
                res = await self.research.run({'mode': 'web', 'query': desc})
            elif agent_name == 'coding':
                res = await self.coding.run({'mode': 'generate', 'task': desc})
            elif agent_name == 'review':
                # expect code in previous step result
                prev_code = None
                # try to get last code produced
                for s in reversed(trace['steps']):
                    if s.get('result', {}).get('code'):
                        prev_code = s['result']['code']
                        break
                if prev_code:
                    res = await self.reviewer.run({'code': prev_code})
                else:
                    res = {'ok': True, 'result': {'issues': []}, 'note': 'no code to review'}
            elif agent_name == 'mentor':
                res = await self.mentor.run({'topic': desc})
            elif agent_name == 'memory':
                self.memory.add_plan({'description': desc})
                res = {'ok': True, 'result': {'stored': True}}
            else:
                res = {'ok': False, 'error': 'unknown_agent'}

            trace_step = {'agent': agent_name, 'description': desc, 'result': res}
            trace['steps'].append(trace_step)
            # semantic memory add for research results
            if agent_name == 'research' and res.get('result'):
                for r in res['result'].get('results', []):
                    key = r.get('url', '')[:80]
                    self.memory.semantic_add(key, r.get('summary', ''), {'source': r.get('url')})

            await maybe_call(stream_cb, {'phase': 'step_done', 'agent': agent_name, 'result': res})

        # final mentor summary
        if explain:
            await maybe_call(stream_cb, {'phase': 'summarize'})
            summary = await self.mentor.run({'topic': user_prompt})
            trace['mentor_summary'] = summary

        # publish trace on message bus for UI
        await bus.publish('orchestrator.trace', trace)
        return trace


async def maybe_call(cb, payload):
    if not cb:
        return
    if asyncio.iscoroutinefunction(cb):
        await cb(payload)
    else:
        cb(payload)
"""Orchestrator: coordinates planner, research, coding, mentor, security, testing, memory agents"""
from typing import Dict, Any
import asyncio
from .logger import get_logger
from .planner_agent import PlannerAgent
from .research_agent import ResearchAgent
from .coding_agent import CodingAgent
from .mentor_agent import MentorAgent
from .security_agent import SecurityAgent
from .testing_agent import TestingAgent
from .memory_agent import MemoryAgent
from .approval_agent import ApprovalAgent, ApprovalStore

_LOG = get_logger(__name__)


class Orchestrator:
    def __init__(self, file_writer=None, index=None):
        self.planner = PlannerAgent()
        self.research = ResearchAgent(index=index)
        self.coding = CodingAgent(file_writer=file_writer)
        self.mentor = MentorAgent()
        self.security = SecurityAgent()
        self.testing = TestingAgent()
        self.memory = MemoryAgent()
        self.approval = ApprovalAgent()
        self.approval_store = self.approval.store

    async def run(self, goal: str, workspace: str) -> Dict[str, Any]:
        _LOG.info("Orchestrator starting for: %s", goal)
        # Step 1: Plan
        plan_resp = await self.planner.run({"goal": goal})
        plan = plan_resp.get("result") if plan_resp.get("ok") else {}

        # Step 2: Research context for each task (parallel)
        tasks = plan.get("tasks", [])
        research_tasks = []
        for t in tasks:
            research_tasks.append(self.research.run({"query": t.get("title"), "k": 3}))
        research_results = await asyncio.gather(*research_tasks)

        # Step 3: For each task, generate code, run security checks, test, save memory, and ask mentor to explain
        task_outputs = []
        for i, t in enumerate(tasks):
            # Compose prompt with research context
            hits = research_results[i].get("result", {}).get("hits", []) if research_results[i].get("ok") else []
            prompt = f"Implement task: {t.get('title')}\nContext:\n" + "\n".join(h.get('text','') for h in hits)
            # Generate code
            code_resp = await self.coding.run({"task": t, "prompt": prompt, "workspace": workspace})
            # Security scan
            code_path = code_resp.get("result", {}).get("path")
            code_text = ""
            try:
                if code_path:
                    with open(code_path, "r", encoding="utf-8") as fh:
                        code_text = fh.read()
            except Exception:
                code_text = ""
            sec = await self.security.run({"code": code_text, "prompt": prompt})
            # Testing (this may involve running shell commands -> check approval)
            test_action = {"type": "run_tests", "cmd": payload.get("test_cmd") if (payload := t.get('meta', {})) else "pytest -q"}
            # ask approval agent
            apr = await self.approval.run({"action": test_action, "resume_state": {"task_index": i, "task": t, "workspace": workspace}})
            apr_result = apr.get("result", {}) if apr.get("ok") else {}
            if apr_result.get("needs_approval"):
                # pause orchestration and return approval id
                approval_id = apr_result.get("approval_id")
                _LOG.info("Pausing orchestration for approval %s", approval_id)
                return {"status": "paused", "approval_id": approval_id, "task_index": i, "task": t}
            # proceed with tests
            test = await self.testing.run({"workspace": workspace})
            # Save memory and get mentor explanation
            mem = await self.memory.run({"action": "save", "key": t.get("id"), "data": {"task": t, "path": code_path}})
            mentor = await self.mentor.run({"topic": t.get("title")})
            task_outputs.append({"task": t, "code": code_resp, "security": sec, "test": test, "memory": mem, "mentor": mentor})

        return {"plan": plan, "tasks": task_outputs}
