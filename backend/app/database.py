"""Simple PostgreSQL CRUD helpers for ScanPlan.

Each operation opens a short-lived synchronous connection. This is intentionally
simple and avoids Windows asyncio compatibility issues in this student project.
"""

import uuid

import psycopg
from psycopg.rows import dict_row

from .config import DATABASE_URL


def _connect():
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)


async def close_pool():
    """Kept for compatibility; short-lived connections need no pool cleanup."""


async def create_profile(user_id: str, full_name: str):
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO profiles (id, full_name, created_at)
            VALUES (%s, %s, NOW())
            ON CONFLICT (id) DO NOTHING
            """,
            (user_id, full_name),
        )


async def get_deadlines(user_id: str) -> list[dict]:
    with _connect() as conn:
        return conn.execute(
            """
            SELECT id, user_id, title, course_name, deadline_type,
                   due_date, created_at, updated_at
            FROM deadlines
            WHERE user_id = %s
            ORDER BY due_date ASC
            """,
            (user_id,),
        ).fetchall()


async def create_deadline(
    user_id: str,
    title: str,
    course_name: str,
    deadline_type: str,
    due_date: str,
) -> dict:
    with _connect() as conn:
        row = conn.execute(
            """
            INSERT INTO deadlines (id, user_id, title, course_name,
                                   deadline_type, due_date, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
            RETURNING id, user_id, title, course_name, deadline_type,
                      due_date, created_at, updated_at
            """,
            (str(uuid.uuid4()), user_id, title, course_name, deadline_type, due_date),
        ).fetchone()
        return dict(row) if row else {}


async def update_deadline(deadline_id: str, user_id: str, fields: dict) -> dict | None:
    allowed_fields = {"title", "course_name", "deadline_type", "due_date"}
    updates = [(key, value) for key, value in fields.items() if key in allowed_fields and value is not None]
    if not updates:
        return None

    set_parts = [f"{key} = %s" for key, _ in updates]
    values = [value for _, value in updates]
    values.extend([deadline_id, user_id])

    with _connect() as conn:
        row = conn.execute(
            f"""
            UPDATE deadlines
            SET {', '.join(set_parts)}, updated_at = NOW()
            WHERE id = %s AND user_id = %s
            RETURNING id, user_id, title, course_name, deadline_type,
                      due_date, created_at, updated_at
            """,
            values,
        ).fetchone()
        return dict(row) if row else None


async def delete_deadline(deadline_id: str, user_id: str) -> bool:
    with _connect() as conn:
        cursor = conn.execute(
            "DELETE FROM deadlines WHERE id = %s AND user_id = %s",
            (deadline_id, user_id),
        )
        return cursor.rowcount > 0


async def get_reminder_settings(user_id: str) -> dict | None:
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT user_id, remind_5_days, remind_3_days, remind_1_day,
                   notifications_enabled, updated_at
            FROM reminder_settings
            WHERE user_id = %s
            """,
            (user_id,),
        ).fetchone()
        return dict(row) if row else None


async def upsert_reminder_settings(user_id: str, fields: dict) -> dict:
    with _connect() as conn:
        row = conn.execute(
            """
            INSERT INTO reminder_settings (user_id, remind_5_days, remind_3_days,
                                           remind_1_day, notifications_enabled, updated_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            ON CONFLICT (user_id)
            DO UPDATE SET
                remind_5_days = COALESCE(%s, reminder_settings.remind_5_days),
                remind_3_days = COALESCE(%s, reminder_settings.remind_3_days),
                remind_1_day = COALESCE(%s, reminder_settings.remind_1_day),
                notifications_enabled = COALESCE(%s, reminder_settings.notifications_enabled),
                updated_at = NOW()
            RETURNING user_id, remind_5_days, remind_3_days, remind_1_day,
                      notifications_enabled, updated_at
            """,
            (
                user_id,
                fields.get("remind_5_days", True),
                fields.get("remind_3_days", True),
                fields.get("remind_1_day", True),
                fields.get("notifications_enabled", True),
                fields.get("remind_5_days"),
                fields.get("remind_3_days"),
                fields.get("remind_1_day"),
                fields.get("notifications_enabled"),
            ),
        ).fetchone()
        return dict(row) if row else {}


async def create_syllabus_record(
    user_id: str,
    file_name: str,
    processing_status: str = "completed",
) -> str:
    syllabus_id = str(uuid.uuid4())
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO syllabi (id, user_id, file_name, processing_status, created_at)
            VALUES (%s, %s, %s, %s, NOW())
            """,
            (syllabus_id, user_id, file_name, processing_status),
        )
    return syllabus_id
