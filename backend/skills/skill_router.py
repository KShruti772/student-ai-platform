"""Skill Router

This module implements a local, modular skill ecosystem router that:
- discovers skills under the repository `skills/` folder
- computes embeddings for skill descriptions (using sentence-transformers)
- semantically matches user intent to skills (cosine similarity)
- dynamically loads and activates skill modules when requested
- produces Mentor-style explanations (uses local LLM when available)

Design goals: simple, local-first, beginner-friendly, and production-ready.
"""
from typing import List, Dict, Any, Optional
import os
import json
import hashlib
import importlib
from pathlib import Path
from utils.logger import get_logger

_LOG = get_logger(__name__)

try:
    from sentence_transformers import SentenceTransformer
    import numpy as np
except Exception:
    SentenceTransformer = None
    np = None


class SkillRouter:
    def __init__(self, skills_dir: str = None, model_name: str = "all-MiniLM-L6-v2"):
        self.repo_root = Path(os.getcwd())
        self.skills_dir = Path(skills_dir or self.repo_root / "skills")
        self.model_name = model_name
        self.model = None
        self.skill_index: List[Dict[str, Any]] = []
        self.embeddings_cache_path = self.repo_root / ".cache" / "skill_embeddings.json"
        self._load_model()
        self.discover_skills()

    def _load_model(self):
        if SentenceTransformer is None:
            _LOG.warning("sentence-transformers not available; semantic matching disabled")
            return
        try:
            self.model = SentenceTransformer(self.model_name)
        except Exception as e:
            _LOG.warning("Failed to load embedding model: %s", e)
            self.model = None

    def discover_skills(self):
        """Scan the `skills/` folder and load metadata for each skill."""
        skills = []
        if not self.skills_dir.exists():
            _LOG.info("No skills directory found at %s", self.skills_dir)
            self.skill_index = []
            return

        for child in sorted(self.skills_dir.iterdir()):
            if not child.is_dir():
                continue
            name = child.name
            skill_md = child / "SKILL.md"
            desc = ""
            if skill_md.exists():
                try:
                    desc = skill_md.read_text(encoding="utf-8")
                except Exception:
                    desc = ""

            examples = []
            templates = []
            for dname in ("examples", "templates"):
                d = child / dname
                if d.exists():
                    for f in sorted(d.rglob("*")):
                        if f.is_file():
                            if dname == "examples":
                                examples.append(str(f.relative_to(self.repo_root)))
                            else:
                                templates.append(str(f.relative_to(self.repo_root)))

            skills.append({
                "name": name,
                "path": str(child.relative_to(self.repo_root)),
                "description": desc,
                "examples": examples,
                "templates": templates,
            })

        self.skill_index = skills
        # compute embeddings if model available
        if self.model:
            self._ensure_embeddings()

    def _ensure_embeddings(self):
        try:
            cache_dir = self.embeddings_cache_path.parent
            cache_dir.mkdir(parents=True, exist_ok=True)
            # Compute combined text per skill
            texts = [s["description"] or s["name"] for s in self.skill_index]
            # create deterministic fingerprint to invalidate cache when SKILL.md changes
            fingerprint = hashlib.sha1("\n".join(texts).encode("utf-8")).hexdigest()
            if self.embeddings_cache_path.exists():
                data = json.loads(self.embeddings_cache_path.read_text(encoding="utf-8"))
                if data.get("fingerprint") == fingerprint:
                    # load saved embeddings
                    for i, s in enumerate(self.skill_index):
                        s["embedding"] = np.array(data["embeddings"][i], dtype=float)
                    return

            embs = self.model.encode(texts, show_progress_bar=False)
            # attach embeddings
            for i, s in enumerate(self.skill_index):
                s["embedding"] = np.array(embs[i], dtype=float).tolist()

            # persist cache
            json.dump({
                "fingerprint": fingerprint,
                "embeddings": [list(map(float, e)) for e in embs.tolist()],
            }, self.embeddings_cache_path.open("w", encoding="utf-8"))
        except Exception as e:
            _LOG.warning("Failed to build or cache skill embeddings: %s", e)

    def _embed(self, text: str):
        if not self.model:
            return None
        try:
            v = self.model.encode([text], show_progress_bar=False)[0]
            return np.array(v, dtype=float)
        except Exception:
            return None

    def match_skills(self, user_intent: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Return top-k matching skills with scores and mentor explanations.

        Each returned dict contains: name, path, score, reason (mentor-style)
        """
        if not self.skill_index:
            return []

        # If embedding model available, use semantic matching
        query_emb = self._embed(user_intent) if self.model else None
        results = []
        for s in self.skill_index:
            score = 0.0
            if query_emb is not None and "embedding" in s:
                try:
                    se = np.array(s["embedding"], dtype=float)
                    # cosine similarity
                    score = float(np.dot(query_emb, se) / (np.linalg.norm(query_emb) * np.linalg.norm(se) + 1e-9))
                except Exception:
                    score = 0.0
            else:
                # fallback: simple substring match on description
                txt = (s.get("description") or "").lower()
                score = 1.0 if any(w in user_intent.lower() for w in txt.split()) else 0.0

            results.append({"name": s["name"], "path": s["path"], "score": score, "skill": s})

        results = sorted(results, key=lambda r: r["score"], reverse=True)[:top_k]

        # attach mentor explanation using local LLM if available
        for r in results:
            r["mentor_explanation"] = self._mentor_explain(user_intent, r)

        return results

    def _mentor_explain(self, user_intent: str, match: Dict[str, Any]) -> str:
        """Produce a short educational explanation of why a skill was selected.

        This will call a local LLM (if available) or produce a deterministic template.
        """
        try:
            mod = importlib.import_module("local_ai.llm_client")
            llm = getattr(mod, "default_llm")
            prompt = (
                "You are a friendly mentor. The user asked: \"%s\". "
                "Based on the skill '%s' (description below), explain in 2-3 sentences why this skill is a good match and how it would be used in a step-by-step mini-workflow. "
                "Return plain text.\n\nSKILL_DESCRIPTION:\n%s"
            ) % (user_intent, match["name"], match["skill"].get("description", ""))
            resp = llm.generate_response(prompt)
            return resp
        except Exception:
            # fallback explanation
            desc = (match["skill"].get("description") or "").strip().split("\n")[0]
            return (
                f"Selected because the skill '{match['name']}' covers this area. "
                f"Top-line: {desc}. Suggested flow: 1) review examples, 2) apply templates, 3) run example script."
            )

    def activate_skill(self, name: str) -> Dict[str, Any]:
        """Activate a skill by name. Dynamically imports `skills.<name>.skill` if present.

        Returns a dict with `status`, `message`, and `payload` (metadata or module info).
        """
        skill = next((s for s in self.skill_index if s["name"] == name), None)
        if not skill:
            return {"status": "error", "message": "skill not found", "payload": None}

        # attempt dynamic import of a python skill module at `skills.<name>.skill`
        module_path = f"skills.{name}.skill"
        try:
            mod = importlib.import_module(module_path)
            # if module exposes `activate()` call it and capture returned context
            payload = None
            if hasattr(mod, "activate"):
                payload = mod.activate()
            return {"status": "ok", "message": "loaded module", "payload": payload}
        except ModuleNotFoundError:
            # no module, return metadata so caller can use templates/examples
            return {"status": "ok", "message": "metadata only", "payload": skill}
        except Exception as e:
            return {"status": "error", "message": str(e), "payload": None}

    def get_skill(self, name: str) -> Optional[Dict[str, Any]]:
        return next((s for s in self.skill_index if s["name"] == name), None)

    # Backwards-compatible simple keyword route used by ExecutionEngine
    def route(self, text: str, top_k: int = 3) -> List[str]:
        matches = self.match_skills(text, top_k=top_k)
        return [m["name"] for m in matches]


__all__ = ["SkillRouter"]
