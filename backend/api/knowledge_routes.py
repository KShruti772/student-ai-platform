from fastapi import APIRouter, UploadFile, File, HTTPException
from knowledge_base.indexer import KnowledgeIndexer
from utils.logger import get_logger
import shutil
from pathlib import Path

router = APIRouter()
_LOG = get_logger(__name__)
_indexer = None


def get_indexer() -> KnowledgeIndexer:
    global _indexer
    if _indexer is None:
        _indexer = KnowledgeIndexer()
    return _indexer


@router.post("/knowledge/upload")
async def upload_file(file: UploadFile = File(...), collection: str = "default"):
    target_dir = Path("./data/uploads")
    target_dir.mkdir(parents=True, exist_ok=True)
    safe_name = Path(file.filename or "").name
    if not safe_name:
        raise HTTPException(status_code=400, detail="filename is required")
    target = target_dir / safe_name
    try:
        with target.open("wb") as f:
            shutil.copyfileobj(file.file, f)
    finally:
        file.file.close()
    res = get_indexer().index_path(collection, str(target))
    return {"status": "ok", "result": res}


@router.get("/knowledge/search")
def search(collection: str = "default", q: str = "", top_k: int = 5):
    if not q:
        raise HTTPException(status_code=400, detail="q parameter required")
    res = get_indexer().search(collection, q, top_k)
    return {"status": "ok", "result": res}
