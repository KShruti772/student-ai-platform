"""
Vector store using ChromaDB for local persistence.

This module provides simple APIs to create collections, add documents with
embeddings, and query by embedding similarity.
"""
from typing import List, Dict, Any
from utils.logger import get_logger
from pathlib import Path

_LOG = get_logger(__name__)


class VectorStore:
    def __init__(self, persist_dir: str = None):
        try:
            import chromadb
            from chromadb.config import Settings as ChromaSettings
        except Exception as e:
            _LOG.exception("chromadb not installed: %s", e)
            raise

        self.persist_dir = persist_dir or str(Path.cwd() / "knowledge_store")
        Path(self.persist_dir).mkdir(parents=True, exist_ok=True)
        if hasattr(chromadb, "PersistentClient"):
            self.client = chromadb.PersistentClient(path=self.persist_dir)
        else:
            self.client = chromadb.Client(
                ChromaSettings(
                    chroma_db_impl="duckdb+parquet",
                    persist_directory=self.persist_dir,
                )
            )

    def get_or_create_collection(self, name: str):
        try:
            return self.client.get_collection(name)
        except Exception:
            _LOG.info("Creating chroma collection %s", name)
            return self.client.create_collection(name)

    def add_documents(self, collection_name: str, ids: List[str], metadatas: List[Dict[str, Any]], embeddings: List[List[float]], documents: List[str]):
        col = self.get_or_create_collection(collection_name)
        col.add(ids=ids, metadatas=metadatas, embeddings=embeddings, documents=documents)
        persist = getattr(self.client, "persist", None)
        if callable(persist):
            persist()

    def query(self, collection_name: str, embedding: List[float], top_k: int = 5):
        col = self.get_or_create_collection(collection_name)
        results = col.query(query_embeddings=[embedding], n_results=top_k)
        return results
