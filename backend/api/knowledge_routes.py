import json
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from knowledge_base.indexer import KnowledgeIndexer
from utils.logger import get_logger

router = APIRouter()
_LOG = get_logger(__name__)
_indexer = None

MAX_UPLOAD_BYTES = 20 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".docx"}
UPLOAD_DIR = Path("./data/uploads")
METADATA_DIR = Path("./data/knowledge_metadata")


def get_indexer() -> KnowledgeIndexer:
    global _indexer
    if _indexer is None:
        _indexer = KnowledgeIndexer()
    return _indexer


def _read_metadata(collection: str) -> list[dict]:
    path = METADATA_DIR / f"{collection}.jsonl"
    if not path.exists():
        return []
    entries = []
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        try:
            entries.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return entries


def _search_uploaded_files(collection: str, query: str, top_k: int) -> list[dict]:
    terms = [term for term in query.lower().split() if term]
    matches = []
    for item in reversed(_read_metadata(collection)):
        filename = str(item.get("filename", ""))
        path = Path(str(item.get("path", "")))
        text = ""
        if path.suffix.lower() in {".txt", ".md"} and path.exists():
            text = path.read_text(encoding="utf-8", errors="ignore")[:20_000]
        haystack = f"{filename} {text}".lower()
        if not terms or any(term in haystack for term in terms):
            matches.append({
                "id": filename,
                "text": text[:1200] or f"{filename} was uploaded and saved in collection {collection}.",
                "metadata": item,
                "score": 1.0,
            })
        if len(matches) >= top_k:
            break
    return matches


@router.post("/knowledge/upload")
async def upload_file(file: UploadFile = File(...), collection: str = "default"):
    safe_name = Path(file.filename or "").name
    if not safe_name:
        raise HTTPException(status_code=400, detail="filename is required")
    extension = Path(safe_name).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Please upload PDF, TXT, MD, or DOCX.")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    METADATA_DIR.mkdir(parents=True, exist_ok=True)
    body = await file.read()
    await file.close()
    if len(body) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File is larger than 20 MB.")

    target = UPLOAD_DIR / safe_name
    target.write_bytes(body)

    result = {"indexed_chunks": 0}
    extraction_pending = extension in {".pdf", ".docx"}
    index_error = None
    try:
        result = get_indexer().index_path(collection, str(target))
    except Exception as exc:
        index_error = str(exc)
        _LOG.exception("Knowledge upload saved but indexing failed for %s: %s", safe_name, index_error)

    metadata = {
        "filename": safe_name,
        "collection": collection,
        "size": len(body),
        "content_type": file.content_type,
        "path": str(target),
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "indexed_chunks": result.get("indexed_chunks", 0) if isinstance(result, dict) else 0,
        "index_error": index_error,
    }
    metadata_path = METADATA_DIR / f"{collection}.jsonl"
    with metadata_path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(metadata, ensure_ascii=False) + "\n")

    indexed_chunks = metadata["indexed_chunks"]
    if index_error or indexed_chunks == 0:
        message = "File uploaded successfully. Text extraction is pending." if extraction_pending else "File uploaded successfully. Indexing is pending."
    else:
        message = "File uploaded and indexed successfully."

    return {
        "success": True,
        "status": "ok",
        "filename": safe_name,
        "collection": collection,
        "message": message,
        "backend_saved": True,
        "extraction_pending": bool(index_error or indexed_chunks == 0),
        "result": result,
        "metadata": metadata,
        "warning": index_error,
    }


@router.get("/knowledge/health")
async def knowledge_health():
    return {
        "status": "ok",
        "upload_endpoint": True,
        "accepted_extensions": sorted(ALLOWED_EXTENSIONS),
        "max_upload_mb": MAX_UPLOAD_BYTES // 1024 // 1024,
    }


@router.get("/knowledge/search")
def search(collection: str = "default", q: str = "", top_k: int = 5):
    if not q:
        raise HTTPException(status_code=400, detail="q parameter required")
    try:
        res = get_indexer().search(collection, q, top_k)
        fallback = _search_uploaded_files(collection, q, top_k)
        if fallback and (not res or not any(res.values() if isinstance(res, dict) else [])):
            return {"status": "ok", "result": fallback, "source": "uploaded_files"}
        return {"status": "ok", "result": res}
    except Exception as exc:
        _LOG.exception("Knowledge vector search failed, using uploaded-file fallback: %s", exc)
        return {"status": "ok", "result": _search_uploaded_files(collection, q, top_k), "source": "uploaded_files"}
