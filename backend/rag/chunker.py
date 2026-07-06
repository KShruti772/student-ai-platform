"""
Simple text chunker for RAG pipeline.

Splits text into overlapping chunks to fit model context windows.
"""
from typing import List, Dict


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[Dict[str, str]]:
    """Return list of {'id':..., 'text':...} chunks."""
    if chunk_size <= 0:
        raise ValueError("chunk_size must be > 0")
    chunks = []
    start = 0
    idx = 0
    L = len(text)
    while start < L:
        end = min(start + chunk_size, L)
        chunk = text[start:end]
        chunks.append({"id": f"chunk_{idx}", "text": chunk})
        idx += 1
        start = end - overlap if (end + 1) < L else end
    return chunks
