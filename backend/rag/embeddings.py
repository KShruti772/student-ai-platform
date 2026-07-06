"""
Embeddings wrapper using sentence-transformers.

Loads a local embedding model and encodes texts into vectors.
"""
from typing import List
from utils.logger import get_logger
from config.settings import settings

_LOG = get_logger(__name__)


class EmbeddingModel:
    def __init__(self, model_name: str = None):
        # Default to a compact local model suitable for students
        self.model_name = model_name or "all-MiniLM-L6-v2"
        self.model = None

    def _ensure_model(self):
        if self.model is None:
            try:
                from sentence_transformers import SentenceTransformer
                _LOG.info("Loading embedding model %s", self.model_name)
                self.model = SentenceTransformer(self.model_name)
            except Exception as e:
                _LOG.exception("Failed to load embedding model: %s", e)
                raise

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        self._ensure_model()
        return [vec.tolist() for vec in self.model.encode(texts)]
