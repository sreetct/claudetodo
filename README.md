# ClaudeTodo

A lightweight todo application. Create, complete, and delete todos through a
clean web UI backed by a small REST API.

Built per the [Product Requirements Document](docs/PRD.md).

## Tech Stack

- **Frontend:** React + Vite (JavaScript)
- **Backend:** Python FastAPI (served by Uvicorn)
- **Storage:** SQLite via SQLAlchemy

## Project Structure

```
claudetodo/
├── docs/            # PRD and design docs
├── backend/         # FastAPI app
│   ├── main.py      # all API routes
│   └── requirements.txt
└── frontend/        # Vite + React app
    └── src/
        ├── App.jsx  # UI (hooks, functional components)
        ├── api.js   # all backend API calls
        └── App.css  # styles (no inline CSS)
```

## Local Development

The backend and frontend are separate processes — run each in its own terminal.

### 1. Backend (FastAPI, port 8000)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

Quick check: `GET http://localhost:8000/health` → `{"status":"ok"}`.
Interactive docs: `http://localhost:8000/docs`.

### 2. Frontend (Vite, port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The frontend calls the backend at
`http://localhost:8000` by default (configured in `frontend/src/api.js`).

## API Endpoints

| Method | Path             | Body                              | Response      |
|--------|------------------|-----------------------------------|---------------|
| GET    | `/health`        | —                                 | `{"status":"ok"}` |
| GET    | `/api/todos`     | —                                 | `Todo[]`      |
| POST   | `/api/todos`     | `{"title": string}`               | `Todo` (201)  |
| PATCH  | `/api/todos/{id}` | `{"completed": boolean}`          | `Todo`        |
| DELETE | `/api/todos/{id}` | —                                | 204           |

Empty titles are rejected with `400`. Unknown ids return `404`. Todos are
stored in a local SQLite database (`backend/claudetodo.db`) and persist
across server restarts.

## Deploy to Render

A `render.yaml` Blueprint is included at the repo root. It defines two services:

- `sreetct-claudetodo-backend` — Python web service (free plan)
- `sreetct-claudetodo-frontend` — static site

### Steps

1. Push this repo to your own public GitHub account.
2. In the Render dashboard: **New +** → **Blueprint**.
3. Select the repo and branch; let both services build.
4. After the backend is live, copy its public URL from the Render dashboard.
5. Open the frontend service → **Environment** → set `VITE_API_URL` to the
   backend hostname *without* `https://` (e.g. `sreetct-claudetodo-backend.onrender.com`).
6. Save to trigger a frontend rebuild.

See the full student deployment guide for details and known free-tier limitations.

## Notes

- **CORS:** enabled on the backend (`allow_origins=["*"]`) so the separate
  Render-hosted frontend can call the API.
- **Storage:** SQLite is fine for local dev and demos. On Render's free tier
  the filesystem is ephemeral, so the database may be reset on redeploy or
  spin-down.
