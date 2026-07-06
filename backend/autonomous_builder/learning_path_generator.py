"""
Learning Path Generator

Produces a beginner-friendly learning roadmap explaining architecture, key
concepts, and step-by-step tasks students can follow to understand the project.
"""
from typing import Dict, Any, List


class LearningPathGenerator:
    def __init__(self):
        pass

    def generate(self, architecture: Dict[str, Any], student_level: str = "beginner") -> Dict[str, Any]:
        steps: List[str] = []
        stacks = architecture.get("selected_stack", [])
        steps.append(f"Overview: This project uses {', '.join(stacks)}.")
        if "fastapi" in stacks:
            steps.append("Step 1: Learn FastAPI basics — endpoints, Pydantic, and routing.")
            steps.append("Step 2: Build simple GET/POST endpoints and test with TestClient.")
        if any("transformer" in s or "embedding" in s for s in stacks):
            steps.append("Step 3: Understand embeddings and how RAG uses them for retrieval.")
        steps.append("Step 4: Run the project locally and read the README to understand structure.")
        steps.append("Step 5: Iterate: add tests, evaluate, and deploy locally (containerize if ready).")
        return {"level": student_level, "steps": steps}
