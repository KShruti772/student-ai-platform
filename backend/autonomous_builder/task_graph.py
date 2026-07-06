"""
Task Graph (DAG) system

Implements a simple directed acyclic graph to manage task dependencies and
provide an execution order. Includes a lightweight parallelizable scheduler
simulation that groups independent tasks together.
"""
from typing import Dict, Any, List, Set
from collections import defaultdict, deque
from utils.logger import get_logger

_LOG = get_logger(__name__)


class TaskGraph:
    def __init__(self):
        self.nodes: Dict[str, Dict[str, Any]] = {}
        self.adj: Dict[str, List[str]] = defaultdict(list)
        self.rev: Dict[str, List[str]] = defaultdict(list)

    def add_task(self, task: Dict[str, Any]):
        tid = task.get("id")
        if not tid:
            raise ValueError("Task must have an id")
        self.nodes[tid] = task
        deps = task.get("depends_on", [])
        for d in deps:
            self.adj[d].append(tid)
            self.rev[tid].append(d)

    def topological_order(self) -> List[str]:
        # Kahn's algorithm
        indeg = {n: len(self.rev.get(n, [])) for n in self.nodes}
        q = deque([n for n, d in indeg.items() if d == 0])
        order = []
        while q:
            n = q.popleft()
            order.append(n)
            for nbr in self.adj.get(n, []):
                indeg[nbr] -= 1
                if indeg[nbr] == 0:
                    q.append(nbr)
        if len(order) != len(self.nodes):
            raise RuntimeError("Cycle detected or missing nodes in graph")
        return order

    def execution_groups(self) -> List[List[str]]:
        """Return groups of task ids that can run in parallel (naive grouping)."""
        indeg = {n: len(self.rev.get(n, [])) for n in self.nodes}
        ready = [n for n, d in indeg.items() if d == 0]
        groups = []
        processed: Set[str] = set()
        while ready:
            groups.append(list(ready))
            next_ready = []
            for n in ready:
                processed.add(n)
                for nbr in self.adj.get(n, []):
                    indeg[nbr] -= 1
                    if indeg[nbr] == 0:
                        next_ready.append(nbr)
            ready = next_ready
        if len(processed) != len(self.nodes):
            raise RuntimeError("Cycle detected or graph incomplete")
        return groups

    def run(self, runner_callable):
        """Execute tasks using groups; `runner_callable(task)` should execute and return a result.

        Returns a list of (task_id, result) tuples in execution order.
        """
        groups = self.execution_groups()
        results = []
        for group in groups:
            _LOG.info("Running parallel group: %s", group)
            # For eco-friendly execution, run sequentially within group by default.
            for tid in group:
                task = self.nodes[tid]
                res = runner_callable(task)
                results.append((tid, res))
        return results
