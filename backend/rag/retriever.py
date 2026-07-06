"""
Retriever: given a query, compute embedding and return top documents.
"""
from typing import List, Dict, Any
from .embeddings import EmbeddingModel
from .vector_store import VectorStore
from utils.logger import get_logger

_LOG = get_logger(__name__)


class Retriever:
    def __init__(self, persist_dir: str = None, embedding_model: EmbeddingModel = None):
        self.store = VectorStore(persist_dir=persist_dir)
        self.embedder = embedding_model or EmbeddingModel()

    def add_texts(self, collection: str, texts: List[str], metadatas: List[Dict[str, Any]]):
        ids = [f"doc_{i}" for i in range(len(texts))]
        embeddings = self.embedder.embed_texts(texts)
        self.store.add_documents(collection, ids, metadatas, embeddings, texts)

    def retrieve(self, collection: str, query: str, top_k: int = 5) -> Dict[str, Any]:
        q_emb = self.embedder.embed_texts([query])[0]
        results = self.store.query(collection, q_emb, top_k)
        return results
