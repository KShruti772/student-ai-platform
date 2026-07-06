import os
from pathlib import Path

BASE = Path(__file__).resolve().parents[3]


async def get_project_analytics() -> dict:
    root = BASE
    code_lines = 0
    file_count = 0
    for ext in (".py", ".ts", ".js", ".tsx", ".jsx"):
        for p in root.rglob(f"*{ext}"):
            try:
                with p.open("r", encoding="utf-8", errors="ignore") as fh:
                    lines = fh.readlines()
                    code_lines += len(lines)
                    file_count += 1
            except Exception:
                continue

    # Use simple heuristics for tasks: count workflow files as pending/completed
    workflows_dir = root / "workflows"
    tasks_completed = 0
    tasks_pending = 0
    if workflows_dir.exists():
        for p in workflows_dir.iterdir():
            if p.is_file():
                tasks_completed += 1

    # fallback small numbers if nothing found
    if tasks_completed == 0:
        tasks_completed = 0
        tasks_pending = 5

    coverage = 0
    # estimate coverage based on presence of tests
    tests = list(root.rglob("test_*.py"))
    if file_count > 0:
        coverage = min(100, int(len(tests) / max(1, file_count) * 100))

    return {
        "tasks_completed": tasks_completed,
        "tasks_pending": tasks_pending,
        "code_lines": code_lines,
        "coverage": coverage,
    }
