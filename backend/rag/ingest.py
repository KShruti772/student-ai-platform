"""
Ingestion utilities for the local RAG pipeline.

Features:
- Read PDFs (using pypdf) and text/markdown files
- Chunk documents into overlapping pieces suitable for embedding
- Optionally embed and store chunks into ChromaDB via VectorStore
- Persist chunk files locally under `data/chunks/<collection>/`

This module is intentionally beginner-friendly and documented.
"""
from pathlib import Path
from typing import List, Dict, Any
import json
from utils.logger import get_logger

from rag.loader import load_file
from rag.chunker import chunk_text
from rag.embeddings import EmbeddingModel
from rag.vector_store import VectorStore

_LOG = get_logger(__name__)


def _ensure_chunks_dir(collection: str) -> Path:
    base = Path.cwd() / "data" / "chunks" / collection
    base.mkdir(parents=True, exist_ok=True)
    return base


def index_file(path: str, collection: str = "default", chunk_size: int = 1000, overlap: int = 200, embed: bool = True, persist_dir: str = None) -> Dict[str, Any]:
    """
    Ingest a single file: load, chunk, save chunks locally, and optionally embed+store in ChromaDB.

    Returns a summary dict with the number of chunks indexed and where they were saved.
    """
    _LOG.info("Indexing file %s into collection %s", path, collection)

    doc = load_file(path)
    text = doc.get("text", "")
    if not text:
        _LOG.warning("No text extracted from %s", path)
        return {"indexed_chunks": 0}

    chunks = chunk_text(text, chunk_size=chunk_size, overlap=overlap)
    chunk_texts = [c.get("text", "") for c in chunks]

    # Save chunks locally as jsonl for inspection and future tools
    out_dir = _ensure_chunks_dir(collection)
    saved = []
    for i, c in enumerate(chunk_texts):
        meta = {"source": doc["metadata"]["source"], "chunk_id": i}
        fname = out_dir / f"{Path(doc['metadata']['source']).stem}_chunk_{i}.json"
        payload = {"id": f"{Path(doc['metadata']['source']).stem}_chunk_{i}", "text": c, "metadata": meta}
        fname.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        saved.append(str(fname))

    # Optionally compute embeddings and add to vector store
    added = 0
    if embed:
        emb = EmbeddingModel()
        vs = VectorStore(persist_dir=persist_dir)
        ids = [f"{Path(doc['metadata']['source']).stem}_chunk_{i}" for i in range(len(chunk_texts))]
        metadatas = [{"source": doc["metadata"]["source"], "chunk": i} for i in range(len(chunk_texts))]
        try:
            embeddings = emb.embed_texts(chunk_texts)
            vs.add_documents(collection, ids, metadatas, embeddings, chunk_texts)
            added = len(ids)
        except Exception as e:
            _LOG.exception("Embedding or vector store add failed: %s", e)

    return {"indexed_chunks": len(chunk_texts), "chunks_saved": saved, "added_to_vector_store": added}


def index_paths(paths: List[str], collection: str = "default", **kwargs) -> Dict[str, Any]:
    """Index multiple files into the same collection.

    Returns aggregated summary.
    """
    total = 0
    saved_files = []
    total_added = 0
    for p in paths:
        res = index_file(p, collection=collection, **kwargs)
        total += res.get("indexed_chunks", 0)
        saved_files.extend(res.get("chunks_saved", []))
        total_added += res.get("added_to_vector_store", 0)

    return {"indexed_chunks": total, "chunks_saved": saved_files, "added_to_vector_store": total_added}


if __name__ == "__main__":
    # Quick manual test when run directly
    import sys
    if len(sys.argv) < 2:
        print("Usage: python ingest.py <file1> [file2 ...]")
        sys.exit(1)
    paths = sys.argv[1:]
    print(index_paths(paths))
