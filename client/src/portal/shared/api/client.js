// src/portal/shared/api/client.js
// The single axios instance for authenticated portal calls.
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("portal_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Calls that may legitimately return 401 without meaning "session expired".
const AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/google",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/request-access",
  "/auth/change-password",
  "/invites/",
];

let redirecting = false;

export function clearPortalSession() {
  localStorage.removeItem("portal_token");
  localStorage.removeItem("portal_user");
  localStorage.removeItem("portal_permissions");
}

// An expired or revoked session used to leave pages showing errors or empty
// lists. Now any 401 from a protected call returns the user to sign-in and
// brings them back to the page they were on (audit S11).
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const url = String(error?.config?.url || "");
    const isAuthCall = AUTH_ENDPOINTS.some((p) => url.includes(p));
    if (status === 401 && !isAuthCall && !redirecting) {
      redirecting = true;
      clearPortalSession();
      const here = window.location.pathname + window.location.search;
      const next = here.startsWith("/portal") && !here.startsWith("/portal/login") ? here : "/portal";
      window.location.assign(`/portal/login?expired=1&next=${encodeURIComponent(next)}`);
    }
    return Promise.reject(error);
  }
);
