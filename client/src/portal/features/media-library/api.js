// src/portal/features/media-library/api.js
import { api } from "../../shared/api/client";

// Media
export async function listMedia(params = {}) {
  const { data } = await api.get("/media", { params });
  return data;
}

export async function uploadMedia({
  file,
  title = "",
  tags = "",
  category = "",
  status = "draft",
}) {
  const form = new FormData();
  form.append("file", file);
  form.append("title", title);
  form.append("tags", tags);
  form.append("category", category);
  form.append("status", status);

  const { data } = await api.post("/media", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function updateMedia(id, payload) {
  const { data } = await api.patch(`/media/${id}`, payload);
  return data;
}

export async function deleteMedia(id) {
  const { data } = await api.delete(`/media/${id}`);
  return data;
}

// Productions (admin)
export async function listProductions(params = {}) {
  const { data } = await api.get("/productions", { params });
  return data;
}

export async function createProduction(payload) {
  const { data } = await api.post("/productions", payload);
  return data;
}

export async function updateProduction(id, payload) {
  const { data } = await api.patch(`/productions/${id}`, payload);
  return data;
}

export async function deleteProduction(id) {
  const { data } = await api.delete(`/productions/${id}`);
  return data;
}

export async function setProductionStatus(id, status) {
  const { data } = await api.patch(`/productions/${id}`, { status });
  return data;
}
