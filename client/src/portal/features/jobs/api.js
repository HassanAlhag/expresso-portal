import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("portal_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function listJobs(params = {}) {
  const { data } = await api.get("/jobs", { params });
  return data;
}

export async function getJob(id) {
  const { data } = await api.get(`/jobs/${id}`);
  return data;
}

export async function createJob(payload) {
  const { data } = await api.post("/jobs", payload);
  return data;
}

export async function updateJob(id, payload) {
  const { data } = await api.patch(`/jobs/${id}`, payload);
  return data;
}

export async function deleteJob(id) {
  const { data } = await api.delete(`/jobs/${id}`);
  return data;
}

export async function attachMedia(id, mediaIds) {
  const { data } = await api.post(`/jobs/${id}/attach-media`, { mediaIds });
  return data;
}

export async function addApproval(id, payload) {
  const { data } = await api.post(`/jobs/${id}/approval`, payload);
  return data;
}

export async function publishJob(id, payload = {}) {
  const { data } = await api.post(`/jobs/${id}/publish`, payload);
  return data;
}

export async function generateJobsFromEnrollment(enrollmentId) {
  const { data } = await api.post(
    `/jobs/generate/from-enrollment/${enrollmentId}`
  );
  return data;
}
