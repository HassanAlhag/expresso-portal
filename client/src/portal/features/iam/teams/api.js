import { api } from "../../../shared/api/client";

export async function listTeams({
  q = "",
  isActive = "",
  sort = "label",
  page = 1,
  limit = 50,
} = {}) {
  const params = { sort, page, limit };
  if (q) params.q = q;
  if (isActive !== "" && typeof isActive !== "undefined") {
    params.isActive = isActive;
  }

  const { data } = await api.get("/teams", { params });
  return data;
}

export async function getTeam(id) {
  const { data } = await api.get(`/teams/${id}`);
  return data;
}

export async function createTeam(payload) {
  const { data } = await api.post("/teams", payload);
  return data;
}

export async function updateTeam(id, payload) {
  const { data } = await api.patch(`/teams/${id}`, payload);
  return data;
}

export async function setTeamStatus(id, isActive) {
  const { data } = await api.patch(`/teams/${id}/status`, { isActive });
  return data;
}
