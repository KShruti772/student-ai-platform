import chromadb
from sentence_transformers import SentenceTransformer

# Initialize ChromaDB
client = chromadb.PersistentClient(path="./chroma_db")

collection = client.get_or_create_collection("student_ai_knowledge")

# Load embedding model
model = SentenceTransformer("nomic-ai/nomic-embed-text-v1")

def add_document(doc_id, text):
    embedding = model.encode(text).tolist()

    collection.add(
        ids=[doc_id],
        documents=[text],
        embeddings=[embedding]
    )

    print(f"Added document: {doc_id}")

def search_document(query):
    query_embedding = model.encode(query).tolist()

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=3
    )

    return results

# TEST
if __name__ == "__main__":
    add_document(
        "doc1",
        "FastAPI is a modern Python framework for APIs."
    )

    add_document(
        "doc2",
        "Machine learning allows systems to learn from data."
    )

    result = search_document("How to build APIs?")

    print(result)