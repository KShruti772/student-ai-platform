"""
Retrieval and response generation for the local RAG pipeline.

This module accepts a user query, retrieves top relevant chunks from ChromaDB,
injects the retrieved context into a prompt, and calls the local LLM to generate
a mentor-style answer that is student-friendly and explains reasoning.

The implementation favors clarity and modularity so students can extend it.
"""
from typing import List, Dict, Any
from utils.logger import get_logger
from rag.embeddings import EmbeddingModel
from rag.vector_store import VectorStore
from local_ai.llm_client import default_llm
import json

_LOG = get_logger(__name__)


def retrieve_context(collection: str, query: str, top_k: int = 5, persist_dir: str = None) -> Dict[str, Any]:
    """Return the top_k chunks from the vector store for `query`."""
    vs = VectorStore(persist_dir=persist_dir)
    emb = EmbeddingModel()
    q_emb = emb.embed_texts([query])[0]
    res = vs.query(collection, q_emb, top_k)
    # Chroma returns dict-like results: ids, distances, documents, metadatas
    return res


def build_prompt_with_context(query: str, contexts: List[str]) -> List[Dict[str, str]]:
    """Compose messages with system instruction, retrieved context, and user query."""
    system = (
        "You are a patient, educational AI mentor. Use the provided context to answer the student's question. "
        "Explain simply, then provide a technical deep-dive and a suggested learning path."
    )
    # Include retrieved context as a system-level augmentation
    context_block = "\n\nRETRIEVED_CONTEXT:\n" + "\n---\n".join(contexts) if contexts else ""
    messages = [
        {"role": "system", "content": system + context_block},
        {"role": "user", "content": f"Question: {query}\nPlease answer as a mentor: give a simple explanation, technical details, why it matters, and next steps."},
    ]
    return messages


def answer_with_context(collection: str, query: str, top_k: int = 5, persist_dir: str = None, timeout: int = 15) -> Dict[str, Any]:
    """
    Retrieve context and generate a mentor-style answer.

    Returns a dict with: `answer` (model output), `context` (retrieved chunks), and `raw` (raw LLM response).
    """
    _LOG.info("Retrieving context for query: %s", query)
    res = retrieve_context(collection, query, top_k=top_k, persist_dir=persist_dir)

    # Extract documents/texts from Chroma result structure
    contexts = []
    try:
        docs = res.get("documents") or res.get("documents", [])
        if isinstance(docs, list) and docs:
            # docs may be a list of lists when querying multiple queries; handle both
            if isinstance(docs[0], list):
                contexts = docs[0]
            else:
                contexts = docs
    except Exception:
        _LOG.exception("Failed to parse retrieved documents structure")

    messages = build_prompt_with_context(query, contexts)

    # Call the local LLM
    raw = default_llm.generate_response(messages, timeout=timeout)
    try:
        # Try to extract text and JSON if model returns structured output
        text = raw.get("text") if isinstance(raw, dict) else str(raw)
    except Exception:
        text = str(raw)

    # For mentor-style structured output, try to parse JSON blob
    answer = None
    try:
        answer = json.loads(text)
    except Exception:
        answer = {"raw": text}

    return {"answer": answer, "context": contexts, "raw": raw}


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print("Usage: python retrieve.py <collection> <query>")
        sys.exit(1)
    collection = sys.argv[1]
    query = sys.argv[2]
    out = answer_with_context(collection, query)
    print(out)
