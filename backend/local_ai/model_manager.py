"""
Model manager stub for local models.

Purpose:
- Provide a place to add model lifecycle helpers (download, list, switch) later.
- Kept intentionally simple for students to extend.
"""
from typing import List
from config.settings import settings


def list_available_models() -> List[str]:
    # In a real system this might query LM Studio or the filesystem.
    # For now return the configured model as the single candidate.
    return [settings.model_name]


def get_active_model() -> str:
    return settings.model_name
