from langchain.chains.question_answering import load_qa_chain
from langchain.llms import OpenAI
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import OpenAIEmbeddings
import os
from dotenv import load_dotenv

load_dotenv()

class QAService:
    def __init__(self):
        self.llm = OpenAI(temperature=0)
        self.embeddings = OpenAIEmbeddings()
        self.qa_chain = load_qa_chain(self.llm, chain_type="stuff")

    async def get_answer(self, question: str, user_id: str):
        try:
            vector_store_path = f"vector_stores/user_{user_id}"
            
            # Check if vector store exists
            if not os.path.exists(vector_store_path):
                return {
                    "answer": "Please upload a PDF document first.",
                    "citations": []
                }

            # Load the vector store with safe deserialization
            vector_store = FAISS.load_local(
                vector_store_path, 
                self.embeddings,
                allow_dangerous_deserialization=True  # Safe because we created these files
            )
            
            # Search for relevant documents
            docs = vector_store.similarity_search(question)
            
            if not docs:
                return {
                    "answer": "I couldn't find any relevant information in the documents.",
                    "citations": []
                }
            
            # Get answer
            answer = self.qa_chain.run(
                input_documents=docs, 
                question=question
            )
            
            # Extract page numbers from docs
            pages = list(set([str(doc.metadata.get('page', '?')) for doc in docs]))
            
            return {
                "answer": answer,
                "citations": pages
            }
        except Exception as e:
            print(f"Error in QA service: {str(e)}")  # Add logging
            return {
                "answer": "Sorry, I encountered an error while processing your question. Please try uploading the document again.",
                "citations": []
            } 