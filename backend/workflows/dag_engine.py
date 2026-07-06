import asyncio
from typing import Dict, Any, List, Set
from utils.logger import get_logger
from workflows.agent_orchestrator import AgentOrchestrator

_LOG = get_logger(__name__)


class WorkflowNode:
    def __init__(self, node_id: str, agent: str, task: Any, retries: int = 1):
        self.id = node_id
        self.agent = agent
        self.task = task
        self.retries = retries
        self.attempts = 0


class WorkflowDAG:
    def __init__(self, nodes: List[Dict[str, Any]], edges: List[Dict[str, str]]):
        self.nodes: Dict[str, WorkflowNode] = {}
        for n in nodes:
            nid = n.get("id")
            self.nodes[nid] = WorkflowNode(nid, n.get("agent"), n.get("task"), n.get("retries", 1))
        # build dependency map
        self.deps: Dict[str, Set[str]] = {nid: set() for nid in self.nodes}
        self.dependents: Dict[str, Set[str]] = {nid: set() for nid in self.nodes}
        for e in edges:
            src = e.get("source")
            dst = e.get("target")
            if src in self.nodes and dst in self.nodes:
                self.deps[dst].add(src)
                self.dependents[src].add(dst)


class DagExecutor:
    def __init__(self, dag: WorkflowDAG, event_putter: asyncio.Queue | None = None):
        self.dag = dag
        self._orch = AgentOrchestrator()
        self.event_putter = event_putter
        self.results: Dict[str, Any] = {}
        self._running: Set[str] = set()

    async def _emit(self, event: Dict[str, Any]):
        if self.event_putter is not None:
            try:
                await self.event_putter.put(event)
            except Exception:
                _LOG.exception("Failed to emit event")

    async def execute(self):
        # schedule nodes with no dependencies
        ready = [nid for nid, deps in self.dag.deps.items() if not deps]
        tasks = {}
        loop = asyncio.get_running_loop()

        async def run_node(nid: str):
            node = self.dag.nodes[nid]
            await self._emit({"type": "node.started", "node": nid, "agent": node.agent})
            node.attempts += 1
            try:
                # dispatch to appropriate agent method
                result = await loop.run_in_executor(None, self._dispatch, node)
                self.results[nid] = result
                await self._emit({"type": "node.completed", "node": nid, "result": result})
                return True
            except Exception as e:
                _LOG.exception("Node %s failed", nid)
                await self._emit({"type": "node.failed", "node": nid, "error": str(e)})
                if node.attempts < node.retries:
                    # retry by scheduling again
                    return await run_node(nid)
                return False

        async def schedule(nid: str):
            self._running.add(nid)
            ok = await run_node(nid)
            self._running.remove(nid)
            # unlock dependents
            for dep in self.dag.dependents.get(nid, []):
                self.dag.deps[dep].discard(nid)
                if not self.dag.deps[dep] and dep not in tasks:
                    tasks[dep] = asyncio.create_task(schedule(dep))

        for nid in ready:
            tasks[nid] = asyncio.create_task(schedule(nid))

        if tasks:
            await asyncio.gather(*tasks.values())
        return self.results

    def _dispatch(self, node: WorkflowNode):
        # map agent names to AgentOrchestrator methods
        agent = node.agent.lower()
        if agent in ("planner",):
            return self._orch.planner.generate(node.task)
        if agent in ("research",):
            return self._orch.research.generate(node.task)
        if agent in ("coding", "coder"):
            return self._orch.coder.generate(node.task)
        if agent in ("reviewer",):
            return self._orch.reviewer.review(node.task)
        if agent in ("debugger", "debug"):
            return self._orch.debugger.analyze(node.task)
        if agent in ("explainer",):
            return self._orch.explainer.generate(node.task)
        if agent in ("mentor",):
            # mentor.mentor_reply expects (message, session)
            return self._orch.mentor.mentor_reply(node.task, None)
        # fallback: return the task string
        return {"task": node.task}
