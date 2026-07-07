from __future__ import annotations

import asyncio
import json
import re
from typing import Any

from config.settings import settings
from local_ai.model_manager import model_manager
from utils.logger import get_logger

_LOG = get_logger(__name__)


def _keywords(values: list[str]) -> list[str]:
    seen: set[str] = set()
    cleaned: list[str] = []
    for item in values:
        for part in re.split(r"[,;\n]", str(item)):
            value = part.strip()
            key = value.lower()
            if value and key not in seen:
                seen.add(key)
                cleaned.append(value)
    return cleaned


def _extract_json(text: str) -> dict[str, Any] | None:
    try:
        data = json.loads(text)
        return data if isinstance(data, dict) else None
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return None
    try:
        data = json.loads(match.group(0))
        return data if isinstance(data, dict) else None
    except json.JSONDecodeError:
        return None


def _as_list(value: Any, fallback: list[str]) -> list[str]:
    if isinstance(value, list):
        items = [str(item).strip() for item in value if str(item).strip()]
        return items or fallback
    if isinstance(value, str) and value.strip():
        items = [item.strip(" -•\t") for item in re.split(r"\n|;", value) if item.strip(" -•\t")]
        return items or fallback
    return fallback


def _as_score(value: Any, fallback: int) -> int:
    try:
        number = int(float(value))
    except (TypeError, ValueError):
        number = fallback
    return max(0, min(100, number))


def _structured_from_input(resume_text: str, target_role: str, job_keywords: list[str], manual_profile: str, ai_text: str = "") -> dict[str, Any]:
    combined = f"{manual_profile}\n{resume_text}"
    lower = combined.lower()
    keywords = _keywords(job_keywords)
    matched = [keyword for keyword in keywords if keyword.lower() in lower]
    missing = [keyword for keyword in keywords if keyword.lower() not in lower]
    sections = ["education", "experience", "project", "skills", "certification"]
    section_hits = sum(1 for section in sections if section in lower)
    metric_hits = len(re.findall(r"\b\d+(?:[%+x]|\b)", combined))
    action_hits = len(re.findall(r"\b(built|created|designed|implemented|improved|optimized|led|launched|developed|integrated)\b", lower))
    keyword_fit = round((len(matched) / len(keywords)) * 100) if keywords else min(85, 45 + section_hits * 8 + min(action_hits, 5) * 4)
    ats_score = max(20, min(95, round(keyword_fit * 0.45 + section_hits * 9 + min(metric_hits, 6) * 4 + min(action_hits, 8) * 3)))
    role = target_role.strip()
    primary_missing = missing[:6] or ["role-specific tools", "measurable outcomes", "deployment details"]

    return {
        "ats_score": ats_score,
        "keyword_fit": keyword_fit,
        "summary": ai_text.strip()[:700] or f"The resume has usable material for {role}, but it should make role alignment, measurable impact, and keyword coverage easier to scan.",
        "strengths": [
            "Includes relevant experience or project material from the submitted resume.",
            "Provides enough context to tailor bullets toward the target role.",
            "Shows technical direction that can be sharpened with clearer outcomes.",
        ],
        "weaknesses": [
            "Some bullets may not clearly connect action, technology, and measurable result.",
            "Keyword alignment can be improved for the target role.",
            "The strongest projects or achievements should be easier to identify in a quick scan.",
        ],
        "missing_keywords": primary_missing,
        "improved_bullets": [
            f"Built and improved {role.lower()}-relevant projects using the submitted technical experience, emphasizing measurable outcomes and ownership.",
            f"Applied {', '.join((matched or keywords or ['role-relevant technologies'])[:3])} to solve practical problems and communicate implementation tradeoffs.",
            "Documented project scope, architecture, and results so recruiters can quickly understand impact.",
        ],
        "skills_to_add": primary_missing[:5],
        "project_suggestions": [
            f"Add one portfolio project directly aligned with {role}.",
            "Include a README with architecture, setup steps, screenshots, and measurable results.",
        ],
        "priority_improvements": [
            "Rewrite top bullets using action + technology + outcome + metric.",
            "Mirror the most important job description keywords honestly where experience supports them.",
            "Move the strongest role-aligned project or experience near the top.",
        ],
        "rewritten_summary": f"{role} candidate with hands-on experience reflected in the submitted resume, focused on building practical software, communicating technical decisions, and improving measurable outcomes.",
        "interview_readiness": "Prepare concise stories for the strongest projects, especially problem, technical approach, tradeoffs, and measurable result.",
        "next_steps": [
            "Paste the target job description keywords and regenerate the analysis.",
            "Rewrite three bullets with metrics or scope.",
            "Add missing skills only when they are supported by real experience or projects.",
        ],
    }


def _normalize(data: dict[str, Any], resume_text: str, target_role: str, job_keywords: list[str], manual_profile: str) -> dict[str, Any]:
    fallback = _structured_from_input(resume_text, target_role, job_keywords, manual_profile)
    return {
        "ats_score": _as_score(data.get("ats_score"), fallback["ats_score"]),
        "keyword_fit": _as_score(data.get("keyword_fit"), fallback["keyword_fit"]),
        "summary": str(data.get("summary") or fallback["summary"]),
        "strengths": _as_list(data.get("strengths"), fallback["strengths"]),
        "weaknesses": _as_list(data.get("weaknesses"), fallback["weaknesses"]),
        "missing_keywords": _as_list(data.get("missing_keywords"), fallback["missing_keywords"]),
        "improved_bullets": _as_list(data.get("improved_bullets"), fallback["improved_bullets"]),
        "skills_to_add": _as_list(data.get("skills_to_add"), fallback["skills_to_add"]),
        "project_suggestions": _as_list(data.get("project_suggestions"), fallback["project_suggestions"]),
        "priority_improvements": _as_list(data.get("priority_improvements"), fallback["priority_improvements"]),
        "rewritten_summary": str(data.get("rewritten_summary") or fallback["rewritten_summary"]),
        "interview_readiness": str(data.get("interview_readiness") or fallback["interview_readiness"]),
        "next_steps": _as_list(data.get("next_steps"), fallback["next_steps"]),
    }


async def analyze_resume(resume_text: str, target_role: str, job_keywords: list[str], manual_profile: str) -> dict[str, Any]:
    keywords = _keywords(job_keywords)
    prompt = f"""
You are a resume analysis agent. Analyze the submitted resume for the target role.
Return only valid JSON with these keys:
ats_score, keyword_fit, summary, strengths, weaknesses, missing_keywords,
improved_bullets, skills_to_add, project_suggestions, priority_improvements,
rewritten_summary, interview_readiness, next_steps.

Rules:
- Scores must be integers from 0 to 100.
- Base all feedback on the submitted resume/profile and target role.
- Do not invent companies, degrees, or experience.
- Improved bullets may rewrite existing experience, but must stay truthful.

Target role: {target_role}
Job keywords: {keywords}
Manual profile: {manual_profile[:4000]}
Resume text:
{resume_text[:12000]}
"""

    try:
        raw = await asyncio.wait_for(
            model_manager.generate_text(
                [{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=1400,
                timeout=settings.ai_request_timeout,
            ),
            timeout=settings.ai_request_timeout + 5,
        )
    except Exception as exc:
        _LOG.exception("Resume analysis model call failed: %s", exc)
        raise RuntimeError("AI model is not connected. Start the backend, start LM Studio, load the configured model, then retry.") from exc

    parsed = _extract_json(raw)
    if parsed is None:
        return _structured_from_input(resume_text, target_role, keywords, manual_profile, raw)
    return _normalize(parsed, resume_text, target_role, keywords, manual_profile)
