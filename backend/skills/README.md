Skills & Tools System (Phase 5)
================================

Overview
--------
This module implements a lightweight, local-first skills and tool ecosystem.

- `SkillLoader` discovers skills under `skills_catalog/` (each skill has `SKILL.md`).
- `SkillRouter` maps user intent to relevant skills (keyword-based by default).
- `ExecutionEngine` loads skills, injects `SKILL.md` instructions into LLM prompts, and manages lifecycle.
- `ToolRegistry` exposes safe tool functions (`read_file`, `write_file`, `run_command`, `git_*`, `analyze_python`).

Design goals
------------
- Dynamic skill loading: only load minimal instructions needed for a task.
- Tool gating: tools are registered and called explicitly; skills can request tool usage.
- Local-first: tools operate on the local filesystem and process space.
- Extensible: add new skills by creating a folder under `skills_catalog/`.

How it works (beginner-friendly)
--------------------------------
1. A user question is sent to the skill HTTP endpoints.
2. The `SkillRouter` guesses which skills are relevant.
3. `ExecutionEngine` loads matching `SKILL.md` files and prepends them to the model `system` prompt.
4. If deterministic actions are needed (writing files, running commands), registered tools are used.
5. After work is done the engine can unload skills to free memory.

Extending
---------
Add a folder under `skills_catalog/<skill_name>/` and include `SKILL.md`. Optionally add `prompts/`, `templates/`, and `examples/`.
