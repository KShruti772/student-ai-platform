from fastapi import APIRouter, HTTPException

from ..schemas.resume import ResumeAnalyzeRequest, ResumeAnalysisResponse
from ..services.resume import analyze_resume

router = APIRouter()


@router.post("/analyze", response_model=ResumeAnalysisResponse)
async def analyze(payload: ResumeAnalyzeRequest):
    try:
        return await analyze_resume(
            resume_text=payload.resume_text,
            target_role=payload.target_role,
            job_keywords=payload.job_keywords,
            manual_profile=payload.manual_profile,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
