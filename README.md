# 日本語 Practice — AI Conversation Partner

A voice-first Japanese conversation practice app for JLPT N4→N3 learners.
Speak Japanese, get replies by voice and text, see corrections and new vocabulary.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite (better-sqlite3) |
| LLM | Google Gemini (Generative AI API, structured output) |
| Voice | Web Speech API (SpeechRecognition + speechSynthesis) |

## Prerequisites

- Node.js ≥ 18
- A free Gemini API key — get one at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- Chrome or Edge (for Web Speech API in Step 3+)

## Setup

### 1. Clone / enter the directory

```bash
cd japanese-practice
```

### 2. Configure the backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set your Gemini API key:

```
GEMINI_API_KEY=your-key-here
```

### 3. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 4. Run in development

Open **two terminals**:

```bash
# Terminal 1 — backend (port 3001)
cd backend
npm run dev

# Terminal 2 — frontend (port 5173, proxies /api to backend)
cd frontend
npm run dev
```

Then open **http://localhost:5173** in your browser.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | *(required)* | Your Gemini API key (free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)) |
| `MODEL_NAME` | `gemini-3.5-flash-lite` | Gemini model identifier |
| `PORT` | `3001` | Backend port |
| `DB_PATH` | `./data/practice.db` | SQLite database path |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/chat` | Send a message, get AI reply with correction + vocab |
| `POST` | `/api/sessions/:id/summary` | Get session summary + Anki CSV |
| `GET` | `/api/health` | Health check |

### POST /api/chat

Request:
```json
{
  "sessionId": "optional-uuid",
  "userText": "すみません、メニューをください。",
  "settings": {
    "level": "N4",
    "scenario": "restaurant",
    "register": "polite",
    "correctionMode": "immediate"
  }
}
```

Response:
```json
{
  "sessionId": "uuid",
  "reply": "はい、どうぞ。何にしますか？",
  "reply_furigana": "はい、どうぞ。何[なに]にしますか？",
  "correction": {
    "had_error": false,
    "original": "",
    "corrected": "",
    "explanation_en": ""
  },
  "new_vocab": [
    { "word": "メニュー", "reading": "めにゅー", "meaning_en": "menu" }
  ]
}
```

## Furigana Format

The backend instructs Gemini to annotate kanji with readings in the format:

```
漢字[かんじ] → rendered as <ruby>漢字<rt>かんじ</rt></ruby>
```

The frontend parser is tolerant of malformed annotations.

## Project Structure

```
japanese-practice/
├── backend/
│   ├── src/
│   │   ├── config.ts
│   │   ├── index.ts
│   │   ├── db/           schema.ts, queries.ts
│   │   ├── prompts/      partner.md
│   │   ├── routes/       chat.ts, sessions.ts
│   │   └── services/     gemini.ts, promptBuilder.ts
│   ├── data/             (SQLite DB, auto-created)
│   └── .env              (gitignored)
└── frontend/
    └── src/
        ├── api/          client.ts
        ├── components/   UI components
        ├── hooks/        useConversation.ts
        ├── state/        conversationMachine.ts
        ├── types.ts
        └── voice/        SttProvider, TtsProvider, adapters
```

## Running Tests

```bash
# Frontend (Vitest)
cd frontend && npm test

# Backend
cd backend && npm test
```

## Security Notes

- The Gemini API key is **never** sent to the frontend.
- No authentication is implemented (this is a local dev tool).
- Do not expose the backend port publicly.
