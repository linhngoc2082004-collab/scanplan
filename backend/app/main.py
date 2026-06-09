"""
ScanPlan Backend API

FastAPI application with routes for:
- Authentication (signup, login)
- Deadline CRUD operations
- Reminder settings management
- Syllabus upload with deadline extraction
- Batch confirm deadlines after review
"""

# Windows asyncio fix: psycopg async requires SelectorEventLoopPolicy.
# This must run BEFORE any imports that may create an event loop.
import asyncio
import sys
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import os
import tempfile
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

from .config import FRONTEND_ORIGIN
from .models import (
    SignupRequest, LoginRequest, AuthResponse,
    DeadlineCreate, DeadlineUpdate, DeadlineResponse,
    ReminderSettingsUpdate, ReminderSettingsResponse,
    SyllabusUploadResponse, DeadlineDetected, ConfirmDeadlinesRequest,
)
from .supabase_auth import (
    SupabaseAuthError,
    signup as auth_signup,
    login as auth_login,
    get_user as auth_get_user,
)
from .database import (
    create_profile, get_deadlines, create_deadline, update_deadline,
    delete_deadline, get_reminder_settings, upsert_reminder_settings,
    create_syllabus_record, close_pool,
)
from .deadline_extractor import extract_text, extract_deadlines

# Max upload file size: 10 MB
MAX_FILE_SIZE = 10 * 1024 * 1024

# Allowed file extensions
ALLOWED_EXTENSIONS = (".pdf", ".docx", ".txt")

app = FastAPI(title="ScanPlan API", version="1.0.0")

# CORS: allow the frontend to call the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Helper to extract the authenticated user from the access token
async def get_current_user(authorization: str = Header(...)) -> dict:
    """
    Extract the Bearer token from the Authorization header and
    retrieve the user from Supabase Auth.

    NOTE: In production, validate the JWT locally instead of making an HTTP request.
    This approach is simpler for a student project.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.replace("Bearer ", "")
    try:
        user_data = auth_get_user(token)
        user_id = user_data.get("id", "")
        metadata = user_data.get("user_metadata", {}) or {}
        if user_id:
            await create_profile(user_id, metadata.get("full_name", ""))
        return user_data
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


# ---------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------

@app.get("/health")
async def health_check():
    return {"status": "ok"}


# ---------------------------------------------------------------
# Authentication Endpoints
# ---------------------------------------------------------------

@app.post("/auth/signup")
async def signup_route(request: SignupRequest):
    """
    Create a new user via Supabase Auth.

    Includes full_name in user metadata.
    Also creates a profile record in the database.
    """
    try:
        result = auth_signup(request.email, request.password, request.full_name)
    except SupabaseAuthError as e:
        raise HTTPException(status_code=400, detail=f"Signup failed: {str(e)}")

    # Extract user id from the response
    user_id = result.get("user", {}).get("id", "")
    if user_id:
        # Create a profile record in PostgreSQL
        try:
            await create_profile(user_id, request.full_name)
        except Exception:
            # Profile creation is non-critical; don't block signup
            pass

    return result


@app.post("/auth/login")
async def login_route(request: LoginRequest):
    """
    Authenticate a user and return access/refresh tokens.
    """
    try:
        result = auth_login(request.email, request.password)
    except SupabaseAuthError as e:
        raise HTTPException(status_code=401, detail=f"Login failed: {str(e)}")

    # Extract user details from the response
    user = result.get("user", {})
    user_id = user.get("id", "")
    email = user.get("email", "")
    user_metadata = user.get("user_metadata", {}) or {}
    full_name = user_metadata.get("full_name", "")

    return {
        "access_token": result.get("access_token", ""),
        "refresh_token": result.get("refresh_token", ""),
        "expires_in": result.get("expires_in", 3600),
        "user_id": user_id,
        "email": email,
        "full_name": full_name,
    }


# ---------------------------------------------------------------
# Deadline Endpoints
# ---------------------------------------------------------------

@app.get("/deadlines")
async def get_deadlines_route(current_user: dict = Depends(get_current_user)):
    """
    Return all deadlines for the authenticated user.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")

    deadlines = await get_deadlines(user_id)
    # Convert datetime objects to strings for JSON serialization
    result = []
    for d in deadlines:
        result.append({
            "id": str(d["id"]),
            "user_id": str(d["user_id"]),
            "title": d["title"],
            "course_name": d.get("course_name", ""),
            "deadline_type": d.get("deadline_type", ""),
            "due_date": d["due_date"].isoformat() if hasattr(d["due_date"], "isoformat") else str(d["due_date"]),
            "created_at": d["created_at"].isoformat() if hasattr(d["created_at"], "isoformat") else str(d["created_at"]),
            "updated_at": d["updated_at"].isoformat() if hasattr(d["updated_at"], "isoformat") else str(d["updated_at"]),
        })
    return result


@app.post("/deadlines")
async def create_deadline_route(
    request: DeadlineCreate,
    current_user: dict = Depends(get_current_user),
):
    """
    Create a new deadline for the authenticated user.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")

    deadline = await create_deadline(
        user_id=user_id,
        title=request.title,
        course_name=request.course_name or "",
        deadline_type=request.deadline_type or "assignment",
        due_date=request.due_date,
    )

    return {
        "id": str(deadline["id"]),
        "user_id": str(deadline["user_id"]),
        "title": deadline["title"],
        "course_name": deadline.get("course_name", ""),
        "deadline_type": deadline.get("deadline_type", ""),
        "due_date": deadline["due_date"].isoformat() if hasattr(deadline["due_date"], "isoformat") else str(deadline["due_date"]),
        "created_at": deadline["created_at"].isoformat() if hasattr(deadline["created_at"], "isoformat") else str(deadline["created_at"]),
        "updated_at": deadline["updated_at"].isoformat() if hasattr(deadline["updated_at"], "isoformat") else str(deadline["updated_at"]),
    }


@app.post("/deadlines/confirm")
async def confirm_deadlines_route(
    request: ConfirmDeadlinesRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Save a batch of reviewed deadlines to the database.
    This is called AFTER the user reviews detected deadlines on the review screen.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")

    saved_deadlines = []
    for dl in request.deadlines:
        try:
            deadline = await create_deadline(
                user_id=user_id,
                title=dl.title,
                course_name=dl.course_name or "",
                deadline_type=dl.deadline_type or "assignment",
                due_date=dl.due_date,
            )
            saved_deadlines.append({
                "id": str(deadline["id"]),
                "user_id": str(deadline["user_id"]),
                "title": deadline["title"],
                "course_name": deadline.get("course_name", ""),
                "deadline_type": deadline.get("deadline_type", ""),
                "due_date": deadline["due_date"].isoformat() if hasattr(deadline["due_date"], "isoformat") else str(deadline["due_date"]),
            })
        except Exception:
            # Skip individual deadline if save fails
            pass

    return {
        "message": f"Successfully saved {len(saved_deadlines)} deadlines.",
        "deadlines": saved_deadlines,
    }


@app.put("/deadlines/{deadline_id}")
async def update_deadline_route(
    deadline_id: str,
    request: DeadlineUpdate,
    current_user: dict = Depends(get_current_user),
):
    """
    Update a deadline if it belongs to the authenticated user.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")

    fields = {}
    if request.title is not None:
        fields["title"] = request.title
    if request.course_name is not None:
        fields["course_name"] = request.course_name
    if request.deadline_type is not None:
        fields["deadline_type"] = request.deadline_type
    if request.due_date is not None:
        fields["due_date"] = request.due_date

    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    updated = await update_deadline(deadline_id, user_id, fields)
    if not updated:
        raise HTTPException(status_code=404, detail="Deadline not found or not owned by user")

    return {
        "id": str(updated["id"]),
        "user_id": str(updated["user_id"]),
        "title": updated["title"],
        "course_name": updated.get("course_name", ""),
        "deadline_type": updated.get("deadline_type", ""),
        "due_date": updated["due_date"].isoformat() if hasattr(updated["due_date"], "isoformat") else str(updated["due_date"]),
        "created_at": updated["created_at"].isoformat() if hasattr(updated["created_at"], "isoformat") else str(updated["created_at"]),
        "updated_at": updated["updated_at"].isoformat() if hasattr(updated["updated_at"], "isoformat") else str(updated["updated_at"]),
    }


@app.delete("/deadlines/{deadline_id}")
async def delete_deadline_route(
    deadline_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Delete a deadline if it belongs to the authenticated user.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")

    deleted = await delete_deadline(deadline_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Deadline not found or not owned by user")

    return {"message": "Deadline deleted successfully"}


# ---------------------------------------------------------------
# Reminder Settings Endpoints
# ---------------------------------------------------------------

@app.get("/reminder-settings")
async def get_reminder_settings_route(current_user: dict = Depends(get_current_user)):
    """
    Return the authenticated user's reminder settings.
    If no settings exist, return defaults.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")

    settings = await get_reminder_settings(user_id)
    if not settings:
        return {
            "user_id": user_id,
            "remind_5_days": True,
            "remind_3_days": True,
            "remind_1_day": True,
            "notifications_enabled": True,
            "updated_at": "",
        }

    return {
        "user_id": str(settings["user_id"]),
        "remind_5_days": settings["remind_5_days"],
        "remind_3_days": settings["remind_3_days"],
        "remind_1_day": settings["remind_1_day"],
        "notifications_enabled": settings["notifications_enabled"],
        "updated_at": settings["updated_at"].isoformat() if hasattr(settings["updated_at"], "isoformat") else str(settings["updated_at"]),
    }


@app.put("/reminder-settings")
async def update_reminder_settings_route(
    request: ReminderSettingsUpdate,
    current_user: dict = Depends(get_current_user),
):
    """
    Create or update the authenticated user's reminder settings.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")

    fields = {}
    if request.remind_5_days is not None:
        fields["remind_5_days"] = request.remind_5_days
    if request.remind_3_days is not None:
        fields["remind_3_days"] = request.remind_3_days
    if request.remind_1_day is not None:
        fields["remind_1_day"] = request.remind_1_day
    if request.notifications_enabled is not None:
        fields["notifications_enabled"] = request.notifications_enabled

    settings = await upsert_reminder_settings(user_id, fields)
    return {
        "user_id": str(settings["user_id"]),
        "remind_5_days": settings["remind_5_days"],
        "remind_3_days": settings["remind_3_days"],
        "remind_1_day": settings["remind_1_day"],
        "notifications_enabled": settings["notifications_enabled"],
        "updated_at": settings["updated_at"].isoformat() if hasattr(settings["updated_at"], "isoformat") else str(settings["updated_at"]),
    }


# ---------------------------------------------------------------
# Syllabus Upload Endpoint
# ---------------------------------------------------------------

@app.post("/syllabus/upload")
async def upload_syllabus_route(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Accept a syllabus file (PDF, DOCX, TXT), extract text,
    detect deadlines, and return them for user review.

    Deadlines are NOT saved automatically — they are returned
    for the user to review and confirm via POST /deadlines/confirm.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")

    # Validate file type on the backend (don't trust frontend-only validation)
    if not file.filename or not file.filename.lower().endswith(ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload PDF, DOCX, or TXT files.",
        )

    # Read the uploaded file
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file")

    # Validate file size on the backend
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File is too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)} MB.",
        )

    # Extract text from the file
    try:
        text = extract_text(file_bytes, file.filename)
    except ValueError as e:
        # Scanned PDF or no extractable text — return a helpful message
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract text: {str(e)}")

    if not text.strip():
        raise HTTPException(status_code=400, detail="No text could be extracted from the file")

    # Detect deadlines in the extracted text
    detected_deadlines = extract_deadlines(text)

    if not detected_deadlines:
        # No deadlines found. Still record the upload.
        await create_syllabus_record(user_id, file.filename, "no_deadlines_found")
        return {
            "message": "No deadlines were detected in the syllabus. You can add them manually.",
            "deadlines": [],
        }

    # Record the syllabus upload (don't save deadlines yet — wait for user confirmation)
    try:
        await create_syllabus_record(user_id, file.filename, "completed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save syllabus: {str(e)}")

    return {
        "message": f"Successfully detected {len(detected_deadlines)} deadlines. Review and confirm them to save.",
        "deadlines": [
            {
                "title": dl["title"],
                "course_name": dl["course_name"],
                "deadline_type": dl["deadline_type"],
                "due_date": dl["due_date"],
            }
            for dl in detected_deadlines
        ],
    }


# ---------------------------------------------------------------
# Shutdown
# ---------------------------------------------------------------

@app.on_event("shutdown")
async def shutdown():
    """Clean up database connection pool on shutdown."""
    await close_pool()