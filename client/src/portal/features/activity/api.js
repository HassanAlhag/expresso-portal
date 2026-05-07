import { api } from "../../shared/api/client";

export async function listAuditEvents({ page = 1, limit = 30, q = "", action = "" } = {}) {
  const params = new URLSearchParams({ page, limit, q, action });
  const { data } = await api.get(`/audit?${params}`);
  return data;
}
