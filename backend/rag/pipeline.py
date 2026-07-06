"""
High-level RAG pipeline: load documents, chunk, embed, store, and search.
"""
from typing import List, Dict, Any
from rag.loader import load_file
from rag.chunker import chunk_text
from rag.embeddings import EmbeddingModel
from rag.retriever import Retriever
from utils.logger import get_logger
from pathlib import Path

_LOG = get_logger(__name__)


class RAGPipeline:
    def __init__(self, persist_dir: str = None, embed_model_name: str = None):
        self.emb = EmbeddingModel(model_name=embed_model_name)
        self.retriever = Retriever(persist_dir=persist_dir, embedding_model=self.emb)

    def index_file(self, collection: str, path: str, chunk_size: int = 1000, overlap: int = 200):
        doc = load_file(path)
        text = doc.get("text", "")
        chunks = chunk_text(text, chunk_size=chunk_size, overlap=overlap)
        texts = [c.get("text", "") for c in chunks]
        metadatas = [{"source": doc["metadata"]["source"], "chunk_id": c.get("id", "")} for c in chunks]
        _LOG.info("Indexing %d chunks from %s into collection %s", len(texts), path, collection)
        self.retriever.add_texts(collection, texts, metadatas)
        return {"indexed_chunks": len(texts)}

    def search(self, collection: str, query: str, top_k: int = 5) -> Dict[str, Any]:
        res = self.retriever.retrieve(collection, query, top_k)
        return res
