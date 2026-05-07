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
