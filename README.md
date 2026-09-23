# AI Study Assistant

AI Study Assistant is a full-stack web application designed to help students learn, revise, and practice using AI-powered study tools.

Students can enter a topic, select a difficulty level, and use AI to generate explanations, study notes, quizzes, and personalized study plans. The application also provides an AI chat interface for asking follow-up questions and stores conversations so students can return to previous study sessions.

## Features

### Authentication

* User registration
* User login
* JWT-based authentication
* Password hashing using bcrypt
* Protected dashboard access
* Logout functionality
* Password visibility toggle

### AI Study Tools

* Explain a topic using AI
* Generate concise study notes
* Generate quiz/MCQ content
* Generate personalized study plans
* Beginner, Intermediate, and Advanced difficulty levels

### AI Chat

* Chat with the AI about study topics
* Ask follow-up questions
* Conversation-specific chat history
* Loading and error states
* Friendly handling of AI API quota errors

### Conversation Management

* Create multiple study conversations
* Automatically generate conversation titles
* View previous conversations
* Restore previous study content
* Delete conversations
* Right-click conversation deletion
* Delete confirmation dialog

### Study History

Generated explanations, notes, quizzes, and study plans are stored in the database and associated with the corresponding conversation.

### Responsive Interface

The application provides a responsive interface designed for desktop and mobile screen sizes.

The dashboard includes:

* Responsive sidebar
* Mobile navigation drawer
* Study topic and difficulty selection
* AI action buttons
* AI chat interface
* Formatted AI-generated content
* Conversation history
* Delete confirmation modal

## Technology Stack

### Frontend

* React 19
* Vite 8
* React Router
* Axios
* CSS

### Backend

* Node.js
* Express.js
* JWT
* bcryptjs
* dotenv
* Google Gemini API
* PostgreSQL
* pg

### Development Tools

* Git
* GitHub
* VS Code
* Nodemon

## System Architecture

The application follows a client-server architecture.

```text
                    ┌─────────────────────┐
                    │      Student        │
                    │     Web Browser     │
                    └──────────┬──────────┘
                               │
                               │ HTTP / REST API
                               ▼
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │       + Vite         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Express Backend   │
                    │      Node.js        │
                    └──────┬────────┬─────┘
                           │        │
                    ┌──────▼───┐ ┌─▼──────────────┐
                    │PostgreSQL│ │ Google Gemini  │
                    │ Database │ │      API       │
                    └──────────┘ └────────────────┘
```

## Project Structure

```text
AI-Study-Assistant/
│
├── backend/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── aiController.js
│   │   ├── authController.js
│   │   ├── chatController.js
│   │   ├── conversationController.js
│   │   └── studyController.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── verifyToken.js
│   │
│   ├── routes/
│   │   ├── aiRoutes.js
│   │   ├── authRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── conversationRoutes.js
│   │   └── studyRoutes.js
│   │
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   │
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Dashboard.css
│   │   │   ├── Login.jsx
│   │   │   ├── Login.css
│   │   │   ├── Register.jsx
│   │   │   └── Register.css
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── eslint.config.js
│
├── .gitignore
└── README.md
```

## Database

The application uses PostgreSQL for persistent storage.

The database contains tables for user accounts, conversations, messages, and generated study content.

### Users

Stores registered student accounts and authentication information.

```text
users
├── id
├── name
├── email
└── password
```

Passwords are stored as hashes rather than plain-text passwords.

### Conversations

Stores separate study conversations created by users.

```text
conversations
├── id
├── user_id
├── title
└── created_at
```

### Messages

Stores messages belonging to conversations.

```text
messages
├── id
├── conversation_id
├── role
├── content
└── created_at
```

### Study History

Stores AI-generated study content such as explanations, notes, quizzes, and study plans.

```text
study_history
├── id
├── user_id
├── conversation_id
├── topic
├── content_type
├── content
├── difficulty
└── created_at
```

Conversation and study data are associated with authenticated users so that users can access their own study history.

## Authentication Flow

```text
Student
   │
   ▼
Register
   │
   ▼
Password hashed with bcrypt
   │
   ▼
User stored in PostgreSQL
   │
   ▼
Login
   │
   ▼
Credentials verified
   │
   ▼
JWT token generated
   │
   ▼
Token stored by frontend
   │
   ▼
Token sent with protected API requests
   │
   ▼
Backend verifies token
   │
   ▼
Protected resources accessed
```

## AI Workflow

When a student requests an AI-generated study resource:

```text
Student enters topic
        ↓
Selects difficulty
        ↓
Selects an AI study action
        ↓
Frontend sends API request
        ↓
Express backend receives request
        ↓
Prompt is prepared
        ↓
Google Gemini API processes request
        ↓
AI response returned
        ↓
Generated content stored in PostgreSQL
        ↓
Response returned to frontend
        ↓
Student views the generated content
```

## API Endpoints

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
```

### AI Study Tools

```text
POST /api/ai/explain
POST /api/ai/notes
POST /api/ai/quiz
POST /api/ai/study-plan
```

### Chat

```text
POST /api/chat
GET  /api/chat/:conversationId
```

### Conversations

```text
POST   /api/conversations
GET    /api/conversations
GET    /api/conversations/:id
DELETE /api/conversations/:id
```

### Study History

```text
GET /api/study
```

Protected endpoints require a valid JWT authentication token.

## Environment Variables

The backend uses environment variables for sensitive configuration.

Create a file named:

```text
backend/.env
```

Example:

```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

Do not commit the `.env` file to GitHub.

The project uses `.gitignore` rules to prevent environment files and sensitive credentials from being tracked.

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/anandithag2007/AI-Study-Assistant.git
cd AI-Study-Assistant
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create:

```text
backend/.env
```

Add your PostgreSQL connection string, JWT secret, Gemini API key, and server configuration.

### 4. Start the backend

For development:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

For production:

```bash
npm start
```

### 5. Install frontend dependencies

Open another terminal and run:

```bash
cd frontend
npm install
```

### 6. Start the frontend

```bash
npm run dev
```

Vite will display the local frontend URL in the terminal.

## Production Build

To create a production build of the frontend:

```bash
cd frontend
npm run build
```

The production files are generated in the `dist` directory.

## Error Handling

The application handles common errors including:

* Missing required form fields
* Invalid login credentials
* Duplicate registration attempts
* Invalid authentication tokens
* Failed API requests
* AI API errors
* AI usage/quota limits
* Loading states during AI operations

When the Gemini API reaches its usage limit, the application displays a user-friendly message instead of exposing the raw API error.

## Security

The project follows basic security practices including:

* Password hashing using bcrypt
* JWT-based authentication
* Protected backend routes
* Environment variables for API keys and secrets
* `.gitignore` rules for sensitive environment files
* User-specific conversation and study data

Sensitive credentials such as the Gemini API key, database credentials, and JWT secret should never be committed to the public repository.

## Current Limitations

The current version focuses on the core AI study assistant functionality.

The following optional bonus features are not currently implemented:

* PDF/text document upload
* Asking questions directly about uploaded documents
* Exporting notes or quizzes

These features can be added in future versions.

## Future Enhancements

Possible future improvements include:

* PDF and text document uploads
* Question answering over uploaded study material
* Export notes and quizzes
* Interactive quiz scoring
* Student progress tracking
* Study streaks and learning statistics
* More detailed student analytics
* Personalized study recommendations
* Production deployment with hosted frontend, backend, and database

## Git and Repository Hygiene

Sensitive environment files are excluded from version control.

The project uses `.gitignore` rules to prevent files such as the following from being committed:

```text
.env
node_modules/
dist/
build/
```

The public repository contains the source code and configuration examples required to understand and run the project, while sensitive credentials remain in local environment files.

## Testing the Frontend

The frontend production build can be verified using:

```bash
cd frontend
npm run build
```

A successful build generates the production assets inside the `dist` directory.

## Author

Developed as a full-stack AI-powered learning application using React, Node.js, Express, PostgreSQL, and Google Gemini.

## License

This project is intended for educational and demonstration purposes.
