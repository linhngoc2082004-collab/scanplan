# ScanPlan

ScanPlan is a student deadline planner that extracts deadlines from uploaded
syllabus files and displays them in a dashboard and calendar.

## Features

- Supabase signup and login
- Upload PDF, DOCX, or TXT syllabus files
- Detect and save upcoming deadlines
- View, add, edit, and delete deadlines
- Calendar and reminder settings

## Technology

- Frontend: React, TypeScript, Vite
- Backend: Python, FastAPI
- Database and authentication: Supabase
- Deployment: Vercel

## Run Locally

Start the backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Create `backend/.env` from `backend/.env.example` and add your Supabase
credentials before starting the backend.

Start the frontend in another terminal:

```powershell
cd scanplan
npm install
npm run dev
```

Open `http://localhost:5173`.

## Deploy

Import this GitHub repository into Vercel and add `SUPABASE_URL`,
`SUPABASE_ANON_KEY`, and `DATABASE_URL` as environment variables.
