# DocuMind AI

DocuMind AI is an intelligent document Q&A system that allows users to upload PDFs and interact with their content through natural language questions. Built with Next.js and FastAPI, it provides an intuitive chat interface for document analysis.

![DocuMind AI Screenshot](image.png)

## Features

- 📄 PDF Document Upload & Processing
- 💬 Natural Language Q&A with Documents
- 🔍 Intelligent Search & Context Understanding
- 🚀 Real-time Chat Interface
- 📱 Responsive Design
- 🔐 User Authentication
- 📂 Document Management System

## Tech Stack

### Frontend
- Next.js 13+ (App Router)
- TypeScript
- Tailwind CSS
- Shadcn UI Components
- Lucide Icons

### Backend
- FastAPI
- Python 3.8+
- LangChain
- OpenAI
- PostgreSQL
- Prisma ORM

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 16+
- Python 3.8+
- PostgreSQL
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aishwarypatel01/documind-ai.git
   cd documind-ai
   ```

2. **Install Frontend Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Environment Setup**

Create a `.env` file in the root directory:

```plaintext
# Frontend Environment Variables
DATABASE_URL="postgresql://user:password@localhost:5432/documind"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Backend Environment Variables
OPENAI_API_KEY="your-openai-api-key"
JWT_SECRET_KEY="your-jwt-secret-key"
```

5. **Database Setup**
```bash
npx prisma generate
npx prisma db push
```

## Running the Application

1. **Start the Frontend Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **Start the Backend Server**
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

The application will be available at:
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000](http://localhost:8000)
- API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

## Project Structure

```
documind-ai/
├── app/                    # Next.js frontend
│   ├── api/               # API routes
│   ├── components/        # React components
│   ├── chat/              # Chat interface
│   └── ...
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── main.py        # Entry point
│   │   ├── routers/       # API endpoints
│   │   ├── services/      # Business logic
│   │   └── dependencies.py # Dependency injection
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── prisma/                # Database schema
└── public/                # Static assets
```

## API Documentation

The API documentation is available at `/docs` when running the backend server. It includes:
- Authentication endpoints
- Document management
- Q&A functionality
- Chat operations

## Relevant Files

### 1. `app/api/chats/[id]/messages/route.ts`
Handles chat message routing and interactions.

### 2. `backend/app/services/qa_service.py`
Contains the logic for processing questions and retrieving answers from the uploaded documents.

### 3. `backend/app/services/pdf_processor.py`
Responsible for processing PDF files, extracting text, and creating vector stores for document analysis.

### 4. `.env`
Environment variables for both frontend and backend configurations.

### 5. `app/chat/page.tsx`
The main chat interface where users can interact with the document Q&A system.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Development Guidelines

- Follow the existing code style and conventions
- Write meaningful commit messages
- Add appropriate comments and documentation
- Test your changes thoroughly
- Update README if needed

## Testing

```
# Frontend Tests
npm run test
# or
yarn test

# Backend Tests
cd backend
pytest
```

## Deployment

### Frontend (Vercel)
1. Push your code to GitHub
2. Import your repository to Vercel
3. Configure environment variables
4. Deploy

### Backend (Your Choice of Platform)
1. Set up your server (e.g., AWS, DigitalOcean)
2. Configure environment variables
3. Set up PostgreSQL database
4. Deploy using Docker or directly

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [LangChain](https://langchain.readthedocs.io/)
- [OpenAI](https://openai.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/)

## Contact
Project Link: [https://github.com/aishwarypatel01/documind-ai](https://github.com/aishwarypatel01/documind-ai)
