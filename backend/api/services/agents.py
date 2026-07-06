import os
from pathlib import Path

BASE = Path(__file__).resolve().parents[3]


async def get_agent_activity() -> list[dict]:
    """Discover agent modules in backend/agents and return lightweight activity info."""
    agents_dir = BASE / "backend" / "agents"
    out = []
    if agents_dir.exists():
        for p in agents_dir.iterdir():
            if p.suffix == ".py" and p.name != "__init__.py":
                name = p.stem.replace("_", " ").title() + " Agent"
                out.append({"name": name, "status": "active", "task": "Idle"})
    return out
