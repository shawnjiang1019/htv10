import os
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain.schema import Document
from pinecone import Pinecone
import numpy as np

load_dotenv()

gemini_key = os.getenv('gemini_key')
pinecone_key = os.getenv('pinecone_key')

class VectorDB():

    def __init__(self, index_name, dimension=1516):
        self.index_name = index_name
        self.dimension = dimension
        
        # Initialize Pinecone
        self.pc = Pinecone(api_key=pinecone_key)
        
        # Check if index exists, create if not
        if index_name not in [index.name for index in self.pc.list_indexes()]:
            print(f"Index {index_name} does not exist. Creating...")
            self.pc.create_index(
                name=index_name, 
                dimension=self.dimension,
                metric="cosine"
            )

        # Initialize embeddings
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=gemini_key
        )
        
        # Initialize Pinecone vector store
        self.vector_store = PineconeVectorStore(
            index_name=index_name,
            embedding=self.embeddings,
            pinecone_api_key=pinecone_key
        )
        
        print(f"Connected to Pinecone index '{index_name}' with LangChain")
   

    def generate_embedding(self, text: str):
        """Generate embedding using LangChain Google Generative AI"""
        try:
            return self.embeddings.embed_query(text)
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return None        

    def add_documents(self, texts, metadatas=None):
        """Add documents to the vector store"""
        try:
            documents = []
            for i, text in enumerate(texts):
                metadata = metadatas[i] if metadatas and i < len(metadatas) else {}
                documents.append(Document(page_content=text, metadata=metadata))
            
            self.vector_store.add_documents(documents)
            print(f"Added {len(documents)} documents to vector store")
        except Exception as e:
            print(f"Error adding documents: {e}")

    def add_texts(self, texts, metadatas=None):
        """Add texts directly to the vector store"""
        try:
            self.vector_store.add_texts(texts, metadatas=metadatas)
            print(f"Added {len(texts)} texts to vector store")
        except Exception as e:
            print(f"Error adding texts: {e}")

    def search(self, query, top_k=5):
        """Retrieve top-k similar documents from Pinecone using LangChain"""
        try:
            results = self.vector_store.similarity_search_with_score(query, k=top_k)
            return results  # list of (Document, score) tuples
        except Exception as e:
            print(f"Error searching: {e}")
            return []

    def search_by_vector(self, vector, top_k=5):
        """Search using a pre-computed vector"""
        try:
            results = self.vector_store.similarity_search_by_vector_with_score(vector, k=top_k)
            return results
        except Exception as e:
            print(f"Error searching by vector: {e}")
            return []