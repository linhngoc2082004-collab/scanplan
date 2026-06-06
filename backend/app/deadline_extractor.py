"""
Syllabus deadline extraction from PDF, DOCX, and TXT files.

This module extracts text from uploaded syllabus files and uses
simple regex patterns to detect dates and nearby deadline keywords.

This is a basic, transparent approach suitable for a student assignment.
It does NOT use any paid AI service.
"""
import re
from datetime import datetime
from typing import Optional
import io


# Deadline-related keywords to look for near date mentions
DEADLINE_KEYWORDS = [
    "assignment", "exam", "quiz", "presentation", "deadline",
    "due", "test", "project", "paper", "final", "midterm",
    "homework", "lab report", "essay", "term paper", "case study",
    "portfolio", "proposal", "report", "exercise",
]

# Common month name patterns
MONTH_NAMES = (
    r"(?:January|February|March|April|May|June|July|August|"
    r"September|October|November|December|"
    r"Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"
)

# Pattern for dates like "Sep 15", "September 15", "15 September", "15th September"
DATE_PATTERN_1 = rf"({MONTH_NAMES})\s+(\d{{1,2}})(?:st|nd|rd|th)?\b"

# Pattern for dates like "15 September", "15th September"
DATE_PATTERN_2 = rf"(\d{{1,2}})(?:st|nd|rd|th)?\s+({MONTH_NAMES})"

# Pattern for MM/DD/YYYY or MM/DD/YY
DATE_PATTERN_3 = r"(\d{1,2})/(\d{1,2})/(\d{2,4})"

# Pattern for YYYY-MM-DD
DATE_PATTERN_4 = r"(\d{4})-(\d{1,2})-(\d{1,2})"

# Pattern for "Month Day, Year" (e.g. "September 15, 2025")
DATE_PATTERN_5 = rf"({MONTH_NAMES})\s+(\d{{1,2}})(?:st|nd|rd|th)?,\s*(\d{{4}})"


MONTH_ABBREVIATIONS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}

MONTH_FULL = {
    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5,
    "june": 6, "july": 7, "august": 8, "september": 9, "october": 10,
    "november": 11, "december": 12,
}


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file using pypdf."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(file_bytes))
        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        return "\n".join(text_parts)
    except ImportError:
        raise ImportError("pypdf is required to extract text from PDF files.")


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX file using python-docx."""
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        text_parts = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(text_parts)
    except ImportError:
        raise ImportError("python-docx is required to extract text from DOCX files.")


def extract_text(file_bytes: bytes, filename: str) -> str:
    """
    Extract text from an uploaded file based on its extension.

    Supports: .pdf, .docx, .txt (and other plain text).
    """
    lower_name = filename.lower()
    if lower_name.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif lower_name.endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    else:
        # Treat as plain text (txt, csv, etc.)
        return file_bytes.decode("utf-8", errors="replace")


def _month_name_to_number(name: str) -> int:
    """Convert a month name (full or abbreviated) to a number 1-12."""
    cleaned = name.strip().lower()
    if cleaned in MONTH_FULL:
        return MONTH_FULL[cleaned]
    if cleaned in MONTH_ABBREVIATIONS:
        return MONTH_ABBREVIATIONS[cleaned]
    return 1


def _make_date_str(year: int, month: int, day: int) -> str:
    """Format a date as ISO string for the database."""
    return f"{year:04d}-{month:02d}-{day:02d}T23:59:00"


def _find_keyword_nearby(text: str, match_start: int, match_end: int,
                         window: int = 60) -> Optional[str]:
    """
    Look for deadline-related keywords within `window` characters
    before or after a date match.

    Returns the matched keyword (lowercase) or None.
    """
    start = max(0, match_start - window)
    end = min(len(text), match_end + window)
    surrounding = text[start:end].lower()

    for keyword in DEADLINE_KEYWORDS:
        if keyword in surrounding:
            return keyword
    return None


def extract_deadlines(text: str, course_name: str = "") -> list[dict]:
    """
    Scan the extracted syllabus text for dates and check if they appear
    near deadline-related keywords.

    Returns a list of detected deadline dictionaries with:
        title, course_name, deadline_type, due_date
    """
    detected = []
    now = datetime.now()
    current_year = now.year

    # We'll store matches as (start_pos, end_pos, title, deadline_type, due_date)
    # to avoid duplicates.
    seen_dates = set()

    # --- Pattern 1: "Month Day" (Sep 15) ---
    for match in re.finditer(DATE_PATTERN_1, text, re.IGNORECASE):
        month_name = match.group(1)
        day = int(match.group(2))
        month = _month_name_to_number(month_name)

        keyword = _find_keyword_nearby(text, match.start(), match.end())
        if not keyword:
            continue

        date_key = (month, day)
        if date_key in seen_dates:
            continue
        seen_dates.add(date_key)

        title = keyword.title()
        due_date = _make_date_str(current_year, month, day)
        detected.append({
            "title": title,
            "course_name": course_name,
            "deadline_type": keyword,
            "due_date": due_date,
        })

    # --- Pattern 2: "Day Month" (15 September) ---
    for match in re.finditer(DATE_PATTERN_2, text, re.IGNORECASE):
        day = int(match.group(1))
        month_name = match.group(2)
        month = _month_name_to_number(month_name)

        keyword = _find_keyword_nearby(text, match.start(), match.end())
        if not keyword:
            continue

        date_key = (month, day)
        if date_key in seen_dates:
            continue
        seen_dates.add(date_key)

        title = keyword.title()
        due_date = _make_date_str(current_year, month, day)
        detected.append({
            "title": title,
            "course_name": course_name,
            "deadline_type": keyword,
            "due_date": due_date,
        })

    # --- Pattern 3: MM/DD/YYYY ---
    for match in re.finditer(DATE_PATTERN_3, text):
        month = int(match.group(1))
        day = int(match.group(2))
        year_str = match.group(3)
        year = int(year_str) if len(year_str) == 4 else 2000 + int(year_str)

        keyword = _find_keyword_nearby(text, match.start(), match.end())
        if not keyword:
            continue

        date_key = (month, day, year)
        if date_key in seen_dates:
            continue
        seen_dates.add(date_key)

        title = keyword.title()
        due_date = _make_date_str(year, month, day)
        detected.append({
            "title": title,
            "course_name": course_name,
            "deadline_type": keyword,
            "due_date": due_date,
        })

    # --- Pattern 4: YYYY-MM-DD ---
    for match in re.finditer(DATE_PATTERN_4, text):
        year = int(match.group(1))
        month = int(match.group(2))
        day = int(match.group(3))

        keyword = _find_keyword_nearby(text, match.start(), match.end())
        if not keyword:
            continue

        date_key = (month, day, year)
        if date_key in seen_dates:
            continue
        seen_dates.add(date_key)

        title = keyword.title()
        due_date = _make_date_str(year, month, day)
        detected.append({
            "title": title,
            "course_name": course_name,
            "deadline_type": keyword,
            "due_date": due_date,
        })

    # --- Pattern 5: "Month Day, Year" (September 15, 2025) ---
    for match in re.finditer(DATE_PATTERN_5, text, re.IGNORECASE):
        month_name = match.group(1)
        day = int(match.group(2))
        year = int(match.group(3))
        month = _month_name_to_number(month_name)

        keyword = _find_keyword_nearby(text, match.start(), match.end())
        if not keyword:
            continue

        date_key = (month, day, year)
        if date_key in seen_dates:
            continue
        seen_dates.add(date_key)

        title = keyword.title()
        due_date = _make_date_str(year, month, day)
        detected.append({
            "title": title,
            "course_name": course_name,
            "deadline_type": keyword,
            "due_date": due_date,
        })

    return detected