# 🧠 Meeting Intelligence Hub

**The Ultimate AI Command Center for Meeting Transcripts**

Meeting Intelligence Hub solves the "Double Work" cycle of corporate meetings. Instead of manually reviewing transcripts to find decisions and action items, our platform uses Google's **Gemini 2.0 Flash Lite** to automatically extract structured intelligence, track sentiment timelines, and provide a contextual chatbot for all your meeting-related queries.

---

## ✨ Core Features

- **Automated Intelligence**: Extraction of Speakers, Action Items, Decisions, and Deadlines.
- **Sentiment Journey**: A visual timeline of meeting tone (Positive, Neutral, Negative).
- **Contextual AI Chat**: Chat with your meeting transcripts to clarify decisions or ask "Who said what?".
- **User Authentication**: Secure Login/Register system to keep your meeting data private.
- **Persistent Storage**: SQLite database integration ensures your data is saved across sessions.
- **Premium Glassmorphism UI**: A state-of-the-art, responsive interface with cinematic animations.

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- **Python 3.12+**
- **Google Gemini API Key** (Get one at [Google AI Studio](https://aistudio.google.com/))

### 1. Backend Setup
1. Navigate to the `backend` directory.
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure Environment Variables:
   Create a `.env` file in the `backend/` directory:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   SECRET_KEY=generate_a_random_string
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ```
5. Start the Server:
   ```bash
   python -m uvicorn main:app --port 8000 --reload
   ```

### 2. Frontend Setup
The frontend is served directly by the FastAPI backend for a seamless deployment experience.
- Open your browser to [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## 🛠️ Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy (SQLite), passlib (Bcrypt), python-jose (JWT).
- **AI Engine**: Google Gemini 2.0 Flash Lite (via `google-genai` SDK).
- **Frontend**: Vanilla JavaScript (ES6+), CSS3 (Glassmorphism 2.1), HTML5.
- **Icons**: FontAwesome 6.4.

---

## 📁 Directory Structure
```text
meeting-intelligence-hub/
├── backend/            # FastAPI Backend & AI Services
│   ├── data/           # Database & Models
│   ├── routes/         # API & Auth Routers
│   ├── services/       # Gemini AI processing logic
│   └── main.py         # Entry point
├── frontend/           # Vanilla JS/CSS Frontend
│   ├── css/            # Style system
│   ├── js/             # UI & API logic
│   └── index.html      # Main Application
└── README.md           # You are here
```

---

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.
