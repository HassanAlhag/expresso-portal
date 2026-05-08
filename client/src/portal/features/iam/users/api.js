import { api } from "../../../shared/api/client";

// GET /api/users?q&role&isActive&sort&page&limit
export async function listUsers({
  q = "",
  role = "",
  team = "",
  isActive = "",
  sort = "-createdAt",
  page = 1,
  limit = 12,
} = {}) {
  const params = { sort, page, limit };
  if (q) params.q = q;
  if (role) params.role = role;
  if (team) params.team = team;
  if (isActive !== "" && typeof isActive !== "undefined") {
    params.isActive = isActive;
  }

  const { data } = await api.get("/users", { params });
  return data;
}

// GET /api/users/:id
export async function getUser(id) {
  const { data } = await api.get(`/users/${id}`);
  return data;
}

// POST /api/users
export async function createUser(payload) {
  const { data } = await api.post("/users", payload);
  return data;
}

// PATCH /api/users/:id
export async function updateUser(id, payload) {
  const { data } = await api.patch(`/users/${id}`, payload);
  return data;
}

// POST /api/users/:id/reset-password
export async function resetUserPassword(id, { newPassword }) {
  const { data } = await api.post(`/users/${id}/reset-password`, {
    newPassword,
  });
  return data;
}

// PATCH /api/users/:id/status
export async function setUserStatus(id, isActive) {
  const { data } = await api.patch(`/users/${id}/status`, { isActive });
  return data;
}

export async function forceLogoutUser(id) {
  const { data } = await api.post(`/users/${id}/force-logout`);
  return data;
}

// Activity feed (audit logs)
// Backend should expose: GET /api/users/:id/activity
export async function getUserActivity(id, { page = 1, limit = 20 } = {}) {
  const { data } = await api.get(`/users/${id}/activity`, {
    params: { page, limit },
  });
  return data;
}

// Notes
// Backend should expose:
// GET  /api/users/:id/notes
// PATCH /api/users/:id/notes  body: { note }
export async function getUserNotes(id) {
  const { data } = await api.get(`/users/${id}/notes`);
  return data;
}

export async function saveUserNotes(id, note) {
  const { data } = await api.patch(`/users/${id}/notes`, { note });
  return data;
}

// PATCH /api/users/:id/permissions
export async function updateUserPermissions(id, { extraPermissions, revokedPermissions }) {
  const { data } = await api.patch(`/users/${id}/permissions`, { extraPermissions, revokedPermissions });
  return data;
}
