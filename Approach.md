# Approach Document: Meeting Intelligence Hub

**Submitted for:** 2-Week AI Sprint (April 2026)  
**Developer:** AI Sprint Participant  

---

## 📸 1. Solution Design
Meeting Intelligence Hub is designed as a **Vertical AI Agent**. It doesn't just "summarize"; it transforms raw, messy meeting transcripts into a structured "Executive Summary" that is immediately actionable.

### Architecture Overview:
- **Client-Side**: A stateful Vanilla JS application that manages view states, file uploads, and a contextual AI chat interface.
- **Backend (Agentic Layer)**: A FastAPI server that orchestrates the flow between the user's data and the Gemini API. It handles model fallback logic to ensure high availability.
- **Persistence Layer**: A local SQLite database managed by SQLAlchemy, allowing for per-user data isolation and historical meeting retrieval.

---

## 🛠️ 2. Tech Stack Choices & Rationale

### Backend: FastAPI & Python
- **Why**: Python is the lingua franca of AI, and FastAPI provides the best-in-class performance for async I/O operations (essential for long-running AI streaming or heavy processing).
- **Security**: Implemented JWT-based authentication with Bcrypt hashing to demonstrate production-ready data handling.

### Database: SQLite (via SQLAlchemy)
- **Why**: For a standalone intelligence hub, SQLite provides zero-configuration persistence without the overhead of a managed RDS. SQLAlchemy ensures that switching to PostgreSQL for a cloud deployment would be trivial.

### AI Engine: Google Gemini 2.0 Flash Lite
- **Why**: We chose **Gemini 2.0 Flash Lite** for its extreme speed and cost-effectiveness. The model's large context window allows for high-fidelity extraction from lengthy meeting transcripts without truncation.
- **Robustness**: Implemented an automated **Model Fallback & Retry** mechanism. If the primary model hits a quota limit or error (503/429), the system automatically attempts retries or shifts to a different Gemini sibling (`1.5 Flash`) to ensure zero user downtime.

---

## ✨ 3. Why These Choices Were Made
The priority was **"Speed-to-Insight"**. 
- We chose **Vanilla Javascript & CSS** (Glassmorphism design) to eliminate the bloat of modern frameworks like React for a tool that needs to be fast and visually striking out of the box. 
- The **Glassmorphism 2.1** design was chosen to create a "Premium Console" feeling, signaling to the user that they are using a sophisticated intelligence tool.

---

## 🚀 4. Future Improvements (Roadmap)
Given more time, we would implement the following "Next-Gen" features:

1.  **Direct Speech-to-Text Integration**: Adding a "Record Live" feature directly using Gemini's multi-modal capabilities.
2.  **Cross-Meeting RAG (Retrieval-Augmented Generation)**: Allowing the Chatbot to query the entire meeting library simultaneously (e.g., "What were all the decisions made across the last 5 project meetings?").
3.  **Automated Exporting**: One-click export of Action Items to specialized tools like Jira, Trello, or Notion.
4.  **Speaker Profile Mapping**: Using AI to build "Speaker Personas" and track sentiment/involvement over months, not just individual meetings.
