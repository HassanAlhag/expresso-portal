import { api } from "../../../shared/api/client";

export async function listAccessRequests({
  q = "",
  status = "",
  sort = "-createdAt",
  page = 1,
  limit = 20,
} = {}) {
  const params = { sort, page, limit };
  if (q) params.q = q;
  if (status) params.status = status;

  const { data } = await api.get("/access-requests", { params });
  return data;
}

export async function approveAccessRequest(id) {
  const { data } = await api.post(`/access-requests/${id}/approve`);
  return data;
}

export async function rejectAccessRequest(id) {
  const { data } = await api.post(`/access-requests/${id}/reject`);
  return data;
}

export async function inviteFromAccessRequest(id, payload) {
  const { data } = await api.post(`/access-requests/${id}/invite`, payload);
  return data;
}
