"""
Orchestrator Agent

Coordinates Architect -> Planner -> Coding -> Debug -> Evaluate -> Mentor
"""
from typing import Dict, Any
from .architect_agent import ArchitectAgent
from .project_planner import ProjectPlanner
from .task_graph import TaskGraph
from .file_generator import FileGenerator
from .coding_agent import CodingAgent
from .debug_agent import DebugAgent
from .code_integrator import CodeIntegrator
from .project_evaluator import ProjectEvaluator
from .learning_path_generator import LearningPathGenerator
from .security_checker import SecurityChecker
from .workspace_manager import WorkspaceManager
from utils.logger import get_logger

_LOG = get_logger(__name__)


class OrchestratorAgent:
    def __init__(self, workspace_root: str = "workspaces"):
        self.arch = ArchitectAgent()
        self.planner = ProjectPlanner()
        self.fg = FileGenerator()
        self.coding = CodingAgent(self.fg)
        self.debug = DebugAgent()
        self.integrator = CodeIntegrator()
        self.evaluator = ProjectEvaluator()
        self.lp = LearningPathGenerator()
        self.sec = SecurityChecker()
        self.wm = WorkspaceManager(workspace_root)

    def run_project_creation(self, name: str, goal: str) -> Dict[str, Any]:
        _LOG.info("Starting orchestration for %s: %s", name, goal)
        arch = self.arch.analyze_goal(goal)
        roadmap = self.planner.create_roadmap(goal)
        ws = self.wm.create_workspace(name)
        ws_path = ws["path"]
        # create folders
        self.fg.generate_structure(ws_path, arch.get("folders", []))

        # create basic files per tasks
        tg = TaskGraph()
        for t in roadmap.get("tasks", []):
            tg.add_task(t)

        results = []
        for tid, res in tg.run(lambda task: self.coding.generate_file_from_task(ws_path, task)):
            results.append({"task": tid, "result": res})

        debug_report = self.debug.analyze_and_fix(ws_path)
        eval_report = self.evaluator.quick_quality_report(ws_path)
        learn = self.lp.generate(arch)
        sec_report = self.sec.scan_code(ws_path)

        return {
            "workspace": ws_path,
            "architecture": arch,
            "roadmap": roadmap,
            "results": results,
            "debug": debug_report,
            "evaluation": eval_report,
            "learning_path": learn,
            "security": sec_report,
        }
