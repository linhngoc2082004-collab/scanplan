"""
Pydantic models (schemas) for request validation and response formatting.

These define the exact shape of data the API expects and returns.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# --- Authentication ---

class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    user_id: str
    email: str
    full_name: Optional[str] = None


# --- Deadlines ---

class DeadlineCreate(BaseModel):
    title: str
    course_name: Optional[str] = ""
    deadline_type: Optional[str] = "assignment"
    due_date: str  # ISO format: "2025-09-15T23:59:00"


class DeadlineUpdate(BaseModel):
    title: Optional[str] = None
    course_name: Optional[str] = None
    deadline_type: Optional[str] = None
    due_date: Optional[str] = None


class DeadlineResponse(BaseModel):
    id: str
    user_id: str
    title: str
    course_name: str
    deadline_type: str
    due_date: str
    created_at: str
    updated_at: str


# --- Reminder Settings ---

class ReminderSettingsUpdate(BaseModel):
    remind_5_days: Optional[bool] = None
    remind_3_days: Optional[bool] = None
    remind_1_day: Optional[bool] = None
    notifications_enabled: Optional[bool] = None


class ReminderSettingsResponse(BaseModel):
    user_id: str
    remind_5_days: bool
    remind_3_days: bool
    remind_1_day: bool
    notifications_enabled: bool
    updated_at: str


# --- Syllabus Upload ---

class DeadlineDetected(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    title: str
    course_name: str
    deadline_type: str
    due_date: str


class SyllabusUploadResponse(BaseModel):
    message: str
    deadlines: list[DeadlineDetected]


class ConfirmDeadlinesRequest(BaseModel):
    deadlines: list[DeadlineDetected]
