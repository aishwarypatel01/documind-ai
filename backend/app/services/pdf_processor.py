from PyPDF2 import PdfReader
from langchain_community.embeddings import OpenAIEmbeddings
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.vectorstores import FAISS
import os
from dotenv import load_dotenv

load_dotenv()

class PDFProcessor:
    def __init__(self):
        self.text_splitter = CharacterTextSplitter(
            separator="\n",
            chunk_size=800,
            chunk_overlap=200,
            length_function=len,
        )
        self.embeddings = OpenAIEmbeddings()

    async def process_pdf(self, file_path: str, user_id: str):
        # Create vector_stores directory if it doesn't exist
        os.makedirs("vector_stores", exist_ok=True)
        
        # Extract text from PDF
        pdf_reader = PdfReader(file_path)
        raw_text = ''
        page_map = {}
        current_position = 0

        for i, page in enumerate(pdf_reader.pages):
            content = page.extract_text()
            if content:
                raw_text += content + "\n"
                page_map[current_position] = i + 1
                current_position += len(content) + 1

        # Split text into chunks
        texts = self.text_splitter.split_text(raw_text)
        
        # Create metadata for each chunk
        metadatas = [{"page": page_map.get(i, "?")} for i in range(len(texts))]
        
        # Create vector store
        vector_store = FAISS.from_texts(
            texts, 
            self.embeddings,
            metadatas=metadatas
        )
        
        # Save the vector store
        vector_store.save_local(f"vector_stores/user_{user_id}")
        
        return {"message": "PDF processed successfully"} 