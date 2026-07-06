from sentence_transformers import SentenceTransformer

# Load embedding model
model = SentenceTransformer("nomic-ai/nomic-embed-text-v1")

# Test text
text = "Machine learning helps computers learn from data."

# Generate embedding
embedding = model.encode(text)

print("Embedding length:", len(embedding))
print("First 10 values:", embedding[:10])