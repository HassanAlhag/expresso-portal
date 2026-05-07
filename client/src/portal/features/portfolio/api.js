import { api } from "../../shared/api/client";

export async function listPortfolio(params = {}) {
  const { data } = await api.get("/portfolio", { params });
  return data;
}

export async function createPortfolio(payload) {
  const { data } = await api.post("/portfolio", payload);
  return data;
}

export async function updatePortfolio(id, payload) {
  const { data } = await api.patch(`/portfolio/${id}`, payload);
  return data;
}

export async function deletePortfolio(id) {
  const { data } = await api.delete(`/portfolio/${id}`);
  return data;
}
