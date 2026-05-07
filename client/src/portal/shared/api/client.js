// src/portal/shared/api/client.js
import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // ✅ match backend
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("portal_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
