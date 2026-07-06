"""
Document loader for RAG pipeline.

Supports PDFs, markdown, code files and plain text. Returns a normalized
dictionary with `id`, `text`, and `metadata` for downstream processing.
"""
from pathlib import Path
from typing import Dict, Any
import hashlib


def _make_id(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def load_file(path: str) -> Dict[str, Any]:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(path)

    suffix = p.suffix.lower()
    text = ""
    if suffix == ".pdf":
        try:
            from pypdf import PdfReader
            reader = PdfReader(str(p))
            pages = [page.extract_text() or "" for page in reader.pages]
            text = "\n\n".join(pages)
        except Exception:
            # graceful fallback: binary read
            text = ""
    else:
        # markdown, txt, code files
        text = p.read_text(encoding="utf-8", errors="ignore")

    doc_id = _make_id(str(p) + text[:200])
    metadata = {"source": str(p), "suffix": suffix}
    return {"id": doc_id, "text": text, "metadata": metadata}
