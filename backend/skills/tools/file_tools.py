"""
File tools: safe read and write operations for skills.
"""
from pathlib import Path
from typing import Optional
from utils.logger import get_logger

_LOG = get_logger(__name__)


def read_file(path: str, max_chars: Optional[int] = None) -> str:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(path)
    text = p.read_text(encoding="utf-8", errors="ignore")
    return text if max_chars is None else text[:max_chars]


def write_file(path: str, content: str, overwrite: bool = True) -> str:
    p = Path(path)
    if p.exists() and not overwrite:
        raise FileExistsError(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")
    _LOG.info("Wrote file %s (len=%d)", path, len(content))
    return str(p)
