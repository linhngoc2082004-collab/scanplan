# ScanPlan Backend

Python FastAPI backend for the ScanPlan application.

## Prerequisites

- Python 3.11 or higher
- A Supabase project (free tier works)

## Setup

### 1. Clone and navigate to the backend folder

```bash
cd backend
```

### 2. Create a virtual environment

**Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**macOS/Linux:**
```bash
python -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual Supabase project details:
- `SUPABASE_URL` — your Supabase project URL (Settings > API)
- `SUPABASE_ANON_KEY` — your Supabase anon/public key
- `DATABASE_URL` — your Supabase PostgreSQL connection string
- `FRONTEND_ORIGIN` — your frontend URL (default: `http://localhost:5173`)

**Important:** If your database password contains special characters, URL-encode them (e.g., `@` becomes `%40`).

### 5. Run the database schema

1. Go to your Supabase Dashboard: **SQL Editor**
2. Copy the contents of `database_schema.sql`
3. Paste into the SQL Editor and click **Run**

This creates the `profiles`, `deadlines`, `reminder_settings`, and `syllabi` tables.

### 6. Start the backend server

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

To verify it's running:

```bash
curl http://localhost:8000/health
```

Expected response: `{"status": "ok"}`

### 7. View API documentation

FastAPI auto-generates interactive docs:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Returns `{"status": "ok"}` |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Create a new user account |
| POST | `/auth/login` | Log in and receive an access token |

### Deadlines

All deadline endpoints require the `Authorization: Bearer <access_token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/deadlines` | Get all deadlines for logged-in user |
| POST | `/deadlines` | Create a new deadline |
| PUT | `/deadlines/{id}` | Update a deadline |
| DELETE | `/deadlines/{id}` | Delete a deadline |

### Reminder Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reminder-settings` | Get reminder settings for logged-in user |
| PUT | `/reminder-settings` | Create or update reminder settings |

### Syllabus Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/syllabus/upload` | Upload a PDF, DOCX, or TXT syllabus file |

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app, routes, CORS
│   ├── config.py            # Environment variable loading
│   ├── models.py            # Pydantic request/response schemas
│   ├── supabase_auth.py     # Supabase Auth helpers (signup, login, get_user)
│   ├── database.py          # PostgreSQL CRUD operations
│   └── deadline_extractor.py # PDF/DOCX/TXT text extraction + deadline detection
├── .env                     # Environment variables (gitignored)
├── .env.example             # Example environment file
├── requirements.txt         # Python dependencies
└── README.md                # This file
```

## Vercel Deployment

### 1. Push to GitHub

```bash
git add .
git commit -m "Add backend"
git push
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and create a new project
2. Import your GitHub repository
3. Set the **Root Directory** to `backend`
4. Set **Framework Preset** to `Other`
5. Add the following **Environment Variables**:
   - `SUPABASE_URL` — your Supabase project URL
   - `SUPABASE_ANON_KEY` — your Supabase anon key
   - `DATABASE_URL` — your Supabase PostgreSQL connection string
   - `FRONTEND_ORIGIN` — your deployed frontend URL

### 3. Deploy

Click **Deploy**. Vercel will automatically detect the Python serverless function.

## Security Notes

- The `.env` file is in `.gitignore` and will NOT be committed
- All database queries filter by `user_id` to ensure users can only access their own data
- The authentication helper calls Supabase Auth on each request for simplicity
- **In production**, validate the JWT locally instead of making an HTTP call on every request