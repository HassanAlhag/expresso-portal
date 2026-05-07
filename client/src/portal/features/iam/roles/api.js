// src/portal/features/iam/roles/api.js
import { api } from "../../../shared/api/client";

export async function listRoles() {
  const { data } = await api.get("/roles");
  return data;
}

export async function getRole(id) {
  const { data } = await api.get(`/roles/${id}`);
  return data;
}

export async function createRole(payload) {
  const { data } = await api.post("/roles", payload);
  return data;
}

export async function updateRole(id, payload) {
  const { data } = await api.patch(`/roles/${id}`, payload);
  return data;
}
