from pydantic import BaseModel, Field


class ResumeAnalyzeRequest(BaseModel):
    resume_text: str = Field(..., min_length=1)
    target_role: str = Field(..., min_length=1)
    job_keywords: list[str] = []
    manual_profile: str = ""


class ResumeAnalysisResponse(BaseModel):
    ats_score: int
    keyword_fit: int
    summary: str
    strengths: list[str]
    weaknesses: list[str]
    missing_keywords: list[str]
    improved_bullets: list[str]
    skills_to_add: list[str]
    project_suggestions: list[str]
    priority_improvements: list[str]
    rewritten_summary: str
    interview_readiness: str
    next_steps: list[str]
