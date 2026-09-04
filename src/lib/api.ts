/**
 * Thin fetch wrapper around the backend API (see /server). Set VITE_API_URL
 * in a .env file to point at your running API — see .env.example.
 */
const configuredApiUrl = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
const isLocalApi = /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configuredApiUrl);
const useDevProxy = import.meta.env.DEV && Boolean(configuredApiUrl) && !isLocalApi;

// During local Vite development, proxy remote API calls through the dev server
// so the browser stays same-origin and does not reject them because of CORS.
// A localhost API remains direct so local full-stack development still works.
// When no URL is configured in production, keep requests relative so a server
// such as Render can serve the frontend and API from the same origin.
export const API_URL = useDevProxy ? "" : configuredApiUrl;

const ADMIN_TOKEN_KEY = "stbabeth-admin-token";
const TEACHER_TOKEN_KEY = "stbabeth-teacher-token";
const STUDENT_TOKEN_KEY = "stbabeth-student-token";

export function getAdminToken() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(ADMIN_TOKEN_KEY);
}
export function setAdminToken(token: string | null) {
  if (token) window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
  else window.localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function getTeacherToken() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(TEACHER_TOKEN_KEY);
}
export function setTeacherToken(token: string | null) {
  if (token) window.localStorage.setItem(TEACHER_TOKEN_KEY, token);
  else window.localStorage.removeItem(TEACHER_TOKEN_KEY);
}

export function getStudentToken() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(STUDENT_TOKEN_KEY);
}
export function setStudentToken(token: string | null) {
  if (token) window.localStorage.setItem(STUDENT_TOKEN_KEY, token);
  else window.localStorage.removeItem(STUDENT_TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type AuthMode = "none" | "admin" | "teacher" | "student";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: AuthMode;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = "none" } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth === "admin") {
    const token = getAdminToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } else if (auth === "teacher") {
    const token = getTeacherToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } else if (auth === "student") {
    const token = getStudentToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    if (data && typeof data === "object" && "error" in data) {
      const err = (data as { error?: unknown }).error;
      if (typeof err === "string" && err) message = err;
    }
    throw new ApiError(message, res.status);
  }

  return data as T;
}

export const api = {
  get: <T,>(path: string, auth: AuthMode = "none") => apiRequest<T>(path, { method: "GET", auth }),
  post: <T,>(path: string, body?: unknown, auth: AuthMode = "none") => apiRequest<T>(path, { method: "POST", body, auth }),
  put: <T,>(path: string, body?: unknown, auth: AuthMode = "none") => apiRequest<T>(path, { method: "PUT", body, auth }),
  patch: <T,>(path: string, body?: unknown, auth: AuthMode = "none") => apiRequest<T>(path, { method: "PATCH", body, auth }),
  delete: <T,>(path: string, auth: AuthMode = "none") => apiRequest<T>(path, { method: "DELETE", auth }),
};
