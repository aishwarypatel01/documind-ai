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
            
            if not os.path.exists(vector_store_path):
                return {
                    "answer": "Please upload a PDF document first.",
                    "citations": []
                }

            # Load the vector store
            vector_store = FAISS.load_local(
                vector_store_path, 
                self.embeddings,
                allow_dangerous_deserialization=True
            )
            
            # Get relevant documents with scores
            docs_and_scores = vector_store.similarity_search_with_score(question, k=3)
            
            if not docs_and_scores:
                return {
                    "answer": "I couldn't find any relevant information in the documents.",
                    "citations": []
                }

            # Prepare documents and collect citations
            docs = []
            citations = []
            
            for doc, score in docs_and_scores:
                docs.append(doc)
                page_num = doc.metadata.get('page', '?')
                # Extract the first line as a title/context
                context = doc.page_content.split('\n')[0][:100] + "..."
                citations.append({
                    "page": page_num,
                    "context": context,
                    "relevance": f"{(1 - score) * 100:.1f}%"
                })
            
            # Construct a detailed prompt
            full_context = "\n\n---\n\n".join([doc.page_content for doc in docs])
            prompt = f"""Based on the following context, provide a detailed and comprehensive answer to the question:

Context:
{full_context}

Question: {question}

Answer:"""

            # Get answer from QA chain with increased max_length
            answer = self.qa_chain.run(
                input_documents=docs,
                question=prompt,
                max_length=500  # Increase max_length for more detailed output
            )

            # Format the answer with citations
            formatted_answer = f"{answer}\n\n📚 Sources:\n"
            for citation in citations:
                formatted_answer += f"- Page {citation['page']}: {citation['context']} (Relevance: {citation['relevance']})\n"

            return {
                "answer": formatted_answer,
                "citations": [str(c['page']) for c in citations]
            }

        except Exception as e:
            print(f"Error in QA service: {str(e)}")
            return {
                "answer": "Sorry, I encountered an error while processing your question. Please try again.",
                "citations": []
            }