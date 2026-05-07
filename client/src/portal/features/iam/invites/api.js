import { api } from "../../../shared/api/client";

export async function listInvites({
  q = "",
  status = "",
  role = "",
  team = "",
  sort = "-createdAt",
  page = 1,
  limit = 20,
} = {}) {
  const params = { sort, page, limit };
  if (q) params.q = q;
  if (status) params.status = status;
  if (role) params.role = role;
  if (team) params.team = team;

  const { data } = await api.get("/invites", { params });
  return data;
}

export async function createInvite(payload) {
  const { data } = await api.post("/invites", payload);
  return data;
}

export async function cancelInvite(id) {
  const { data } = await api.post(`/invites/${id}/cancel`);
  return data;
}

export async function resendInvite(id) {
  const { data } = await api.post(`/invites/${id}/resend`);
  return data;
}
