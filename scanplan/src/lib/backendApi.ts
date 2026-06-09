// API helper functions for ScanPlan frontend.
// Uses the VITE_BACKEND_URL environment variable to know which backend
// URL to call. All authenticated endpoints include the Bearer token
// stored in localStorage.

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.PROD ? "/api" : "http://localhost:8000");

/**
 * Get the stored access token from localStorage.
 */
function getToken(): string | null {
  return localStorage.getItem("scanplan_access_token");
}

/**
 * Store the access token after login or signup.
 */
function setToken(token: string): void {
  localStorage.setItem("scanplan_access_token", token);
}

/**
 * Remove the token on logout.
 */
function clearToken(): void {
  localStorage.removeItem("scanplan_access_token");
}

/**
 * Helper to make an authenticated API request.
 */
async function authFetch(url: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }
  return response.json();
}

// ---------------------------------------------------------------
// Auth
// ---------------------------------------------------------------

export async function signup(email: string, password: string, full_name: string) {
  const response = await fetch(`${BACKEND_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, full_name }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Signup failed");
  }
  return response.json();
}

export async function login(email: string, password: string) {
  const response = await fetch(`${BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Login failed");
  }
  const data = await response.json();
  // Save the access token to localStorage
  setToken(data.access_token);
  return data;
}

export function logout(): void {
  clearToken();
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ---------------------------------------------------------------
// Deadlines
// ---------------------------------------------------------------

export async function getDeadlines() {
  return authFetch(`${BACKEND_URL}/deadlines`);
}

export async function createDeadline(deadline: {
  title: string;
  course_name?: string;
  deadline_type?: string;
  due_date: string;
}) {
  return authFetch(`${BACKEND_URL}/deadlines`, {
    method: "POST",
    body: JSON.stringify(deadline),
  });
}

export async function updateDeadline(
  deadlineId: string,
  updates: {
    title?: string;
    course_name?: string;
    deadline_type?: string;
    due_date?: string;
  }
) {
  return authFetch(`${BACKEND_URL}/deadlines/${deadlineId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function deleteDeadline(deadlineId: string) {
  return authFetch(`${BACKEND_URL}/deadlines/${deadlineId}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------
// Reminder Settings
// ---------------------------------------------------------------

export async function getReminderSettings() {
  return authFetch(`${BACKEND_URL}/reminder-settings`);
}

export async function updateReminderSettings(settings: {
  remind_5_days?: boolean;
  remind_3_days?: boolean;
  remind_1_day?: boolean;
  notifications_enabled?: boolean;
}) {
  return authFetch(`${BACKEND_URL}/reminder-settings`, {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

// ---------------------------------------------------------------
// Syllabus Upload
// ---------------------------------------------------------------

export async function uploadSyllabus(file: File) {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

  try {
    const response = await fetch(`${BACKEND_URL}/syllabus/upload`, {
      method: "POST",
      headers,
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Upload failed");
    }
    return response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Upload timed out. Please try again.");
    }
    throw err;
  }
}

// ---------------------------------------------------------------
// Batch Confirm Deadlines (after review)
// ---------------------------------------------------------------

export async function confirmDeadlines(deadlines: Array<{
  title: string;
  course_name?: string;
  deadline_type?: string;
  due_date: string;
}>) {
  return authFetch(`${BACKEND_URL}/deadlines/confirm`, {
    method: "POST",
    body: JSON.stringify({ deadlines }),
  });
}
