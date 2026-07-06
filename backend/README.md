# Student AI Platform — Backend (Mentor Agent)

This folder contains the backend for the Student AI Platform. It is designed
to be local-first, educational, and modular so students can learn AI system
engineering while running the project on modest hardware.

Key components:
- `app.py`: FastAPI entrypoint (health checks, CORS, routing)
- `api/routes.py`: HTTP endpoints for agents and workflows
- `agents/mentor_agent.py`: MentorAgent implementing educational responses
- `local_ai/llm_client.py`: OpenAI-compatible local LM Studio client
- `memory/session_memory.py`: short-term session memory for context
- `workflows/student_workflow.py`: orchestrates planner/mentor/explainer
- `prompts/mentor_prompt.txt`: system prompt guiding mentor behavior
- `utils/`: logging and helpers

Getting started
1. Create and activate a Python virtual environment.
2. Install dependencies:

```bash
cd d:/student-ai-platform/backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

3. Ensure a local LM Studio or OpenAI-compatible server is running and
   reachable at the `API_URL` in `.env` (default `http://localhost:1234/v1`).

4. Start the backend:

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Testing

Run the small test suite (requires `pytest`):

```bash
pip install pytest
pytest -q
```

Design notes
- Modules are intentionally small and documented to teach students the role of
  each component.
- MentorAgent asks the model to return structured JSON so frontends can render
  educational sections consistently.

Future improvements
- Add long-term memory backed by a database
- Add async orchestration and task queue for parallel agent runs
- Add more agents (coding agent, debugger, research agent)
