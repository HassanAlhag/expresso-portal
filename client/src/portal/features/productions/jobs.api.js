import { api } from "../../shared/api/client";

export async function listProductionJobs(params = {}) {
  const { data } = await api.get("/jobs", { params });
  return data;
}

export async function getProductionJob(id) {
  const { data } = await api.get(`/jobs/${id}`);
  return data;
}

export async function createProductionJob(payload) {
  const { data } = await api.post("/jobs", payload);
  return data;
}

export async function updateProductionJob(id, payload) {
  const { data } = await api.patch(`/jobs/${id}`, payload);
  return data;
}

export async function deleteProductionJob(id) {
  const { data } = await api.delete(`/jobs/${id}`);
  return data;
}

export async function setProductionJobStatus(id, status) {
  const { data } = await api.patch(`/jobs/${id}`, { status });
  return data;
}

export async function publishProductionJob(id) {
  const { data } = await api.post(`/jobs/${id}/publish`);
  return data;
}
