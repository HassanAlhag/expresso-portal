// src/portal/shared/api/auth.api.js
import { api } from "./client";

/**
 * POST /api/auth/login
 * body: { email, password }
 */
export async function login({ email, password }) {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

/**
 * GET /api/auth/me
 */
export async function me() {
  const { data } = await api.get("/auth/me");
  return data;
}

/**
 * POST /api/auth/forgot-password
 * body: { email }
 */
export async function forgotPassword({ email }) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
}

/**
 * POST /api/auth/reset-password
 * body: { token, newPassword }
 */
export async function resetPassword({ token, newPassword }) {
  const { data } = await api.post("/auth/reset-password", { token, newPassword });
  return data;
}

/**
 * POST /api/auth/request-access
 * body: { fullName, workEmail, company, phone, message }
 */
export async function requestAccess(payload) {
  const { data } = await api.post("/auth/request-access", payload);
  return data;
}

/**
 * POST /api/auth/google
 * body: { credential } — the raw Google ID token from Google Identity
 * Services. The backend verifies it server-side; nothing about the
 * decoded payload is trusted from the frontend.
 */
export async function googleLogin({ credential }) {
  const { data } = await api.post("/auth/google", { credential });
  return data;
}
