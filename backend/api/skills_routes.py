from fastapi import APIRouter, HTTPException
from skills.skill_loader import SkillLoader
from skills.skill_router import SkillRouter
from skills.execution_engine import ExecutionEngine
from skills.tool_registry import ToolRegistry
from skills.tools import read_file, write_file, run_command, git_status, git_log, analyze_python
from agents.mentor_agent import MentorAgent
from utils.logger import get_logger

router = APIRouter()
_LOG = get_logger(__name__)

loader = SkillLoader()
router_engine = ExecutionEngine(skill_loader=loader)
tool_registry = ToolRegistry()

# Register core tools
tool_registry.register("read_file", read_file, description="Read a file from disk")
tool_registry.register("write_file", write_file, description="Write a file to disk")
tool_registry.register("run_command", run_command, description="Run a shell command")
tool_registry.register("git_status", git_status, description="Get git status")
tool_registry.register("git_log", git_log, description="Show git log")
tool_registry.register("analyze_python", analyze_python, description="Analyze Python code statically")

mentor = MentorAgent()


@router.get("/skills/list")
def list_skills():
    skills = loader.discover()
    return {"skills": [s.to_dict() for s in skills.values()]}


@router.post("/skills/detect")
def detect_skills(payload: dict):
    """Detect skills from JSON body: {"text": "user intent"}
    Returns detailed matches (name, path, score, mentor_explanation).
    """
    text = payload.get("text") if isinstance(payload, dict) else None
    if not text:
        raise HTTPException(status_code=400, detail="Missing 'text' in body")

    # ensure loader/router have current discovery state
    loader.discover()
    # use the router directly to get detailed matches
    matches = router_engine.router.match_skills(text, top_k=6)
    return {"detected": matches}


@router.post("/skills/inject")
def inject_prompt(messages: list):
    new = router_engine.inject_skill_instructions(messages)
    return {"messages": new}


@router.post("/skills/tools/list")
def list_tools():
    return {"tools": tool_registry.list_tools()}


@router.post("/skills/explain")
async def explain_selection(payload: dict):
    text = payload.get("text") if isinstance(payload, dict) else None
    if not text:
        raise HTTPException(status_code=400, detail="Missing 'text' in body")
    matches = router_engine.router.match_skills(text, top_k=6)
    tools = list(tool_registry.list_tools().keys())
    # Use MentorAgent to produce a student-friendly explanation
    res = await mentor.handle({"topic": text, "matches": matches, "tools": tools})
    return res


@router.post("/skills/activate")
def activate_skill(payload: dict):
    name = payload.get("name") if isinstance(payload, dict) else None
    if not name:
        raise HTTPException(status_code=400, detail="Missing 'name' in body")
    # use router to activate (dynamic import if provided)
    res = router_engine.router.activate_skill(name)
    return res
