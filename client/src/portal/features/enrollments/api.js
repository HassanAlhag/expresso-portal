import { api } from "../../shared/api/client";

const BASE = "/enrollments";

export async function listEnrollments(params = {}) {
  const { data } = await api.get(BASE, { params });
  return data;
}

export async function getEnrollment(id) {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
}

export async function createEnrollment(payload) {
  const { data } = await api.post(BASE, payload);
  return data;
}

export async function updateEnrollment(id, payload) {
  const { data } = await api.patch(`/enrollments/${id}`, payload);
  return data;
}

export async function deleteEnrollment(id) {
  const { data } = await api.delete(`${BASE}/${id}`);
  return data;
}

export async function generateJobsFromEnrollment(enrollmentId) {
  const { data } = await api.post(
    `/jobs/generate/from-enrollment/${enrollmentId}`
  );
  return data;
}
