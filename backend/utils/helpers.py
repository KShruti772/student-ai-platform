"""
Small helper utilities for the project.

Purpose:
- Keep small helper functions centralized and documented for students.
"""
from typing import Dict, Any


def extract_text_from_llm_response(resp: Dict[str, Any]) -> str:
    """Extract common OpenAI-compatible chat response text.

    Handles variations in providers by checking common paths.
    """
    if not resp:
        return ""
    # Common OpenAI-compatible shape
    try:
        return resp.get("choices", [])[0].get("message", {}).get("content", "")
    except Exception:
        return str(resp)
