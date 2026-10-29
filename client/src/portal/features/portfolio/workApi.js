import { api } from "../../shared/api/client";

// Portfolio work items (/api/work). Case studies use ./api.js (/api/portfolio).

export async function listWorkItems(params = {}) {
  const { data } = await api.get("/work", { params });
  return data;
}

export async function getWorkItem(id) {
  const { data } = await api.get(`/work/${id}`);
  return data;
}

export async function createWorkItem(payload) {
  const { data } = await api.post("/work", payload);
  return data;
}

export async function createWorkItemFromCaseStudy(caseStudyId) {
  const { data } = await api.post(`/work/from-case-study/${caseStudyId}`);
  return data;
}

export async function updateWorkItem(id, payload) {
  const { data } = await api.patch(`/work/${id}`, payload);
  return data;
}

export async function reorderWorkItems(ids) {
  const { data } = await api.patch("/work/reorder", { ids });
  return data;
}

export async function deleteWorkItem(id) {
  const { data } = await api.delete(`/work/${id}`);
  return data;
}
