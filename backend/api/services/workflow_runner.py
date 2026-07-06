import asyncio
import time
import uuid
from copy import deepcopy
from typing import Any

from api.services.chat import send_chat
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)


WORKFLOW_TEMPLATES: list[dict[str, Any]] = [
    {
        "id": "career_roadmap",
        "name": "Career Roadmap Workflow",
        "description": "Turn a career goal into phases, milestones, projects, and interview preparation.",
        "required_input": "Target role, current skills, and timeframe",
        "steps": [
            {"id": "goal-agent", "agent": "Requirement Agent", "task": "Clarify the target role, skill level, and constraints."},
            {"id": "career-agent", "agent": "Career Agent", "task": "Map role expectations, skill gaps, and learning priorities."},
            {"id": "planning-agent", "agent": "Planning Agent", "task": "Create phases, milestones, projects, and checkpoints."},
            {"id": "mentor-agent", "agent": "Mentor Agent", "task": "Add study rhythm, motivation, and next actions."},
        ],
    },
    {
        "id": "resume_review",
        "name": "Resume Review Workflow",
        "description": "Review resume content for ATS fit, missing keywords, and stronger impact bullets.",
        "required_input": "Resume text or profile summary plus the target role",
        "steps": [
            {"id": "requirement-agent", "agent": "Requirement Agent", "task": "Identify role target and resume context."},
            {"id": "resume-agent", "agent": "Resume Agent", "task": "Check ATS alignment, keywords, and section clarity."},
            {"id": "mentor-agent", "agent": "Mentor Agent", "task": "Rewrite bullets with action, technology, outcome, and metric."},
        ],
    },
    {
        "id": "project_builder",
        "name": "Project Builder Workflow",
        "description": "Generate a portfolio-ready software project plan with architecture, files, debugging, and run steps.",
        "required_input": "Project idea, target users, preferred stack, and must-have features",
        "steps": [
            {"id": "requirement-agent", "agent": "Requirement Agent", "task": "Collect users, features, scope, and success criteria."},
            {"id": "planning-agent", "agent": "Planning Agent", "task": "Break the project into milestones and implementation tasks."},
            {"id": "architecture-agent", "agent": "Architecture Agent", "task": "Design the tech stack, folder structure, APIs, and data flow."},
            {"id": "frontend-agent", "agent": "Frontend Agent", "task": "Plan screens, components, states, and user interactions."},
            {"id": "backend-agent", "agent": "Backend Agent", "task": "Plan endpoints, storage, validation, and integration boundaries."},
            {"id": "debug-agent", "agent": "Debug Agent", "task": "Identify likely errors, test strategy, and fixes."},
            {"id": "mentor-agent", "agent": "Mentor Agent", "task": "Explain how to run, extend, and present the project."},
        ],
    },
    {
        "id": "interview_prep",
        "name": "Interview Prep Workflow",
        "description": "Create a technical and behavioral interview practice plan with feedback loops.",
        "required_input": "Target role, interview date, strengths, and weak areas",
        "steps": [
            {"id": "requirement-agent", "agent": "Requirement Agent", "task": "Collect role, timeline, and interview type."},
            {"id": "mentor-agent", "agent": "Mentor Agent", "task": "Generate technical, project, and behavioral practice rounds."},
            {"id": "debug-agent", "agent": "Debug Agent", "task": "Find weak spots and prepare recovery practice."},
        ],
    },
    {
        "id": "knowledge_summary",
        "name": "Knowledge Summary Workflow",
        "description": "Summarize notes or documents into concepts, action items, and study questions.",
        "required_input": "Topic, document summary, notes, or learning material",
        "steps": [
            {"id": "knowledge-agent", "agent": "Knowledge Agent", "task": "Extract important concepts and missing context."},
            {"id": "planning-agent", "agent": "Planning Agent", "task": "Convert the material into a study plan and recall prompts."},
            {"id": "mentor-agent", "agent": "Mentor Agent", "task": "Explain the topic in student-friendly language."},
        ],
    },
    {
        "id": "debugging",
        "name": "Debugging Workflow",
        "description": "Analyze an error log, identify causes, and produce a fix plan.",
        "required_input": "Error message, relevant code, and what you already tried",
        "steps": [
            {"id": "requirement-agent", "agent": "Requirement Agent", "task": "Understand expected behavior and failure context."},
            {"id": "debug-agent", "agent": "Debug Agent", "task": "Find root cause, likely files, and fix strategy."},
            {"id": "mentor-agent", "agent": "Mentor Agent", "task": "Explain the fix and prevention steps."},
        ],
    },
]

WORKFLOW_RUNS: dict[str, dict[str, Any]] = {}


def _template(template_id: str | None) -> dict[str, Any]:
    for template in WORKFLOW_TEMPLATES:
        if template["id"] == template_id:
            return template
    return WORKFLOW_TEMPLATES[2]


def list_templates() -> list[dict[str, Any]]:
    return deepcopy(WORKFLOW_TEMPLATES)


def _nodes_for_steps(steps: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "id": step["id"],
            "type": "statusNode",
            "position": {"x": (index % 3) * 260, "y": (index // 3) * 150},
            "data": {"label": step["agent"], "status": step["status"]},
        }
        for index, step in enumerate(steps)
    ]


def _edges_for_steps(steps: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {"id": f"{steps[index]['id']}-{steps[index + 1]['id']}", "source": steps[index]["id"], "target": steps[index + 1]["id"]}
        for index in range(len(steps) - 1)
    ]


def _base_result(template_id: str, goal: str, ai_text: str | None, ai_error: str | None) -> str:
    subject = goal.strip() or "the student's goal"
    ai_note = ""
    if ai_text:
        ai_note = f"\n\n## AI Guidance\n{ai_text.strip()}"
    elif ai_error:
        ai_note = "\n\n## AI Model Status\nAI model is not connected. Please start LM Studio and load your model."

    if template_id == "career_roadmap":
        body = f"""## Career Roadmap for {subject}

### Learning Path
- Phase 1: strengthen foundations and identify the exact target role.
- Phase 2: build one guided project and one independent portfolio project.
- Phase 3: deepen role-specific skills, system design, and interview communication.
- Phase 4: polish resume, prepare stories, and apply with a weekly cadence.

### Milestones
- Define target role and current skill baseline.
- Finish a public project with README, screenshots, and architecture notes.
- Practice technical and behavioral interviews every week.

### Portfolio Projects
- Skill tracker with AI-generated study plans.
- Resume analyzer for the target role.
- Interview practice assistant with feedback history.
"""
    elif template_id == "resume_review":
        body = f"""## Resume Review for {subject}

### ATS Suggestions
- Mirror keywords from target job descriptions in skills and project bullets.
- Keep bullets outcome-focused: action, technology, impact, metric.
- Put strongest projects and technical skills near the top.

### Missing Keywords to Check
- Frameworks, databases, cloud tools, testing, APIs, Git, deployment, and measurable product impact.

### Improved Bullet Pattern
- Built [feature] using [stack] to improve [outcome], measured by [metric].
"""
    elif template_id == "project_builder":
        body = f"""## Project Builder Result: {subject}

### Requirements
- Clear user problem, core workflow, authentication or saved state if needed, and a demo-ready README.

### Features
- Guided intake, dashboard/workspace, data persistence, validation, error states, and exportable results.

### Tech Stack
- Frontend: Next.js, React, Tailwind, local state.
- Backend: FastAPI, Python services, REST endpoints.
- Optional AI: LM Studio OpenAI-compatible chat completions.

### Folder Structure
```text
app/
  page.tsx
  api/
components/
  workspace/
  forms/
lib/
  api.ts
  storage.ts
backend/
  app.py
  api/
  services/
README.md
```

### Implementation Steps
1. Build the core user flow first.
2. Add API integration with loading and error states.
3. Persist important user artifacts.
4. Add tests, screenshots, and deployment notes.

### How To Run
- Install dependencies.
- Start the backend on port 8002.
- Start the frontend on port 3000.
- Open the app and run the project workflow with a real use case.

### Future Improvements
- Add auth, database persistence, analytics, and downloadable project exports.
"""
    elif template_id == "interview_prep":
        body = f"""## Interview Preparation Plan for {subject}

### Practice Rounds
- Technical fundamentals, project deep dives, system thinking, and behavioral stories.

### Weekly Routine
- Three coding sessions, two project explanation drills, and one mock interview.

### Feedback Loop
- Track weak topics, rewrite answers, and repeat the hardest questions.
"""
    elif template_id == "knowledge_summary":
        body = f"""## Knowledge Summary for {subject}

### Core Concepts
- Identify definitions, examples, formulas or APIs, and common mistakes.

### Study Actions
- Convert notes into flashcards, practice questions, and a 3-day review plan.

### Questions To Ask
- What problem does this solve?
- When should I use it?
- How can I explain it in a project interview?
"""
    else:
        body = f"""## Debugging Plan for {subject}

### Root Cause Checklist
- Reproduce the error, isolate the failing step, inspect recent changes, and verify environment variables.

### Fix Strategy
- Read the first real error, patch the smallest failing boundary, rerun, and document the prevention step.

### Prevention
- Add validation, better logs, tests around the failing path, and clearer setup instructions.
"""
    return body + ai_note


async def _publish(event_bus, event: dict[str, Any]) -> None:
    if event_bus is None:
        return
    try:
        await event_bus.publish(event)
    except Exception:
        logger.exception("Failed to publish workflow event")


async def start_workflow(template_id: str | None, goal: str, session_id: str, event_bus=None) -> dict[str, Any]:
    template = _template(template_id)
    workflow_id = str(uuid.uuid4())
    steps = [{**step, "status": "pending", "progress": 0, "message": step["task"]} for step in template["steps"]]
    run = {
        "workflow_id": workflow_id,
        "template_id": template["id"],
        "workflow_name": template["name"],
        "description": template["description"],
        "required_input": template["required_input"],
        "goal": goal,
        "session_id": session_id,
        "status": "queued",
        "progress": 0,
        "current_step": "",
        "steps": steps,
        "result": "",
        "error": "",
        "created_at": int(time.time() * 1000),
        "updated_at": int(time.time() * 1000),
    }
    WORKFLOW_RUNS[workflow_id] = run
    await _publish(event_bus, {"type": "workflow_log", "workflow_id": workflow_id, "session_id": session_id, "message": f"Queued {template['name']}"})
    asyncio.create_task(run_workflow(workflow_id, event_bus))
    return {
        "workflow_id": workflow_id,
        "workflow": snapshot(workflow_id),
        "templates": list_templates(),
    }


def snapshot(workflow_id: str) -> dict[str, Any]:
    run = WORKFLOW_RUNS.get(workflow_id)
    if not run:
        return {"status": "not_found", "workflow_id": workflow_id}
    data = deepcopy(run)
    data["nodes"] = _nodes_for_steps(data["steps"])
    data["edges"] = _edges_for_steps(data["steps"])
    return data


async def run_workflow(workflow_id: str, event_bus=None) -> None:
    run = WORKFLOW_RUNS[workflow_id]
    steps = run["steps"]
    run["status"] = "running"
    await _publish(event_bus, {"type": "workflow_progress", "workflow_id": workflow_id, "progress": 0, "current_step": "Starting workflow", "nodes": _nodes_for_steps(steps), "edges": _edges_for_steps(steps)})

    for index, step in enumerate(steps):
        run["current_step"] = step["agent"]
        step["status"] = "running"
        step["progress"] = 35
        run["progress"] = round((index / len(steps)) * 100)
        run["updated_at"] = int(time.time() * 1000)
        await _publish(event_bus, {"type": "agent_status", "workflow_id": workflow_id, "agent": step["agent"], "status": "running", "message": step["task"], "progress": step["progress"]})
        await _publish(event_bus, {"type": "node.started", "workflow_id": workflow_id, "node": step["id"], "message": step["task"]})
        await _publish(event_bus, {"type": "workflow_progress", "workflow_id": workflow_id, "progress": run["progress"], "current_step": step["agent"], "nodes": _nodes_for_steps(steps), "edges": _edges_for_steps(steps)})
        await _publish(event_bus, {"type": "workflow_log", "workflow_id": workflow_id, "agent": step["agent"], "message": step["task"]})
        await asyncio.sleep(0.55)
        step["status"] = "completed"
        step["progress"] = 100
        run["progress"] = round(((index + 1) / len(steps)) * 100)
        run["updated_at"] = int(time.time() * 1000)
        await _publish(event_bus, {"type": "agent_status", "workflow_id": workflow_id, "agent": step["agent"], "status": "completed", "message": f"{step['agent']} completed.", "progress": 100})
        await _publish(event_bus, {"type": "node.completed", "workflow_id": workflow_id, "node": step["id"], "message": f"{step['agent']} completed"})
        await _publish(event_bus, {"type": "workflow_progress", "workflow_id": workflow_id, "progress": run["progress"], "current_step": step["agent"], "nodes": _nodes_for_steps(steps), "edges": _edges_for_steps(steps)})

    ai_text = None
    ai_error = None
    try:
        prompt = (
            f"Run the {run['workflow_name']} for this student request:\n{run['goal']}\n\n"
            "Return concise, practical, student-focused sections. Avoid raw internal logs."
        )
        response = await send_chat(prompt, run["session_id"], event_bus=event_bus)
        ai_text = response.response
        ai_error = response.error
    except Exception as exc:
        logger.exception("Workflow AI enrichment failed")
        ai_error = str(exc)

    run["status"] = "completed"
    run["progress"] = 100
    run["current_step"] = "Complete"
    run["result"] = _base_result(run["template_id"], run["goal"], ai_text, ai_error)
    run["error"] = ""
    run["updated_at"] = int(time.time() * 1000)
    await _publish(event_bus, {"type": "workflow_complete", "workflow_id": workflow_id, "result": run["result"], "progress": 100})
    await _publish(event_bus, {"type": "workflow.completed", "workflow_id": workflow_id, "result": run["result"], "progress": 100})


async def retry_step(workflow_id: str, step_id: str, event_bus=None) -> dict[str, Any]:
    run = WORKFLOW_RUNS.get(workflow_id)
    if not run:
        return {"error": "workflow_not_found"}
    step = next((item for item in run["steps"] if item["id"] == step_id), None)
    if not step:
        return {"error": "step_not_found"}
    step["status"] = "retrying"
    step["progress"] = 50
    run["status"] = "running"
    run["current_step"] = step["agent"]
    await _publish(event_bus, {"type": "agent_status", "workflow_id": workflow_id, "agent": step["agent"], "status": "running", "message": f"Retrying {step['agent']}...", "progress": 50})
    await _publish(event_bus, {"type": "workflow_log", "workflow_id": workflow_id, "agent": step["agent"], "message": f"Retry requested for {step['agent']}."})
    await asyncio.sleep(0.5)
    step["status"] = "completed"
    step["progress"] = 100
    run["status"] = "completed" if all(item["status"] == "completed" for item in run["steps"]) else "running"
    await _publish(event_bus, {"type": "agent_status", "workflow_id": workflow_id, "agent": step["agent"], "status": "completed", "message": f"{step['agent']} retry completed.", "progress": 100})
    await _publish(event_bus, {"type": "workflow_progress", "workflow_id": workflow_id, "progress": run["progress"], "current_step": step["agent"], "nodes": _nodes_for_steps(run["steps"]), "edges": _edges_for_steps(run["steps"])})
    return {"ok": True, "workflow": snapshot(workflow_id)}


def default_graph() -> dict[str, Any]:
    template = _template("project_builder")
    steps = [{**step, "status": "pending", "progress": 0} for step in template["steps"]]
    return {"nodes": _nodes_for_steps(steps), "edges": _edges_for_steps(steps)}
