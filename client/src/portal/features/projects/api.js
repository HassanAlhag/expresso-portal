import { api } from "../../shared/api/client";

const BASE = "/projects";

export async function listProjects(params = {}) {
  const { data } = await api.get(BASE, { params });
  return data;
}

export async function createProject(payload) {
  const { data } = await api.post(BASE, payload);
  return data;
}

export async function getProject(id) {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
}

export async function updateProject(id, payload) {
  const { data } = await api.patch(`${BASE}/${id}`, payload);
  return data;
}

export async function archiveProject(id) {
  const { data } = await api.delete(`${BASE}/${id}`);
  return data;
}
