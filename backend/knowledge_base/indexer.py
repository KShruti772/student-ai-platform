"""
Knowledge base indexer using the RAG pipeline.

Provides convenience functions to index project documents and query the knowledge base.
"""
from rag.pipeline import RAGPipeline
from utils.logger import get_logger
from pathlib import Path

_LOG = get_logger(__name__)


class KnowledgeIndexer:
    def __init__(self, store_dir: str = None):
        self.store_dir = store_dir or str(Path.cwd() / "knowledge_store")
        self.pipeline = RAGPipeline(persist_dir=self.store_dir)

    def index_path(self, collection: str, path: str):
        _LOG.info("Indexing path %s into collection %s", path, collection)
        return self.pipeline.index_file(collection, path)

    def search(self, collection: str, query: str, top_k: int = 5):
        return self.pipeline.search(collection, query, top_k)
