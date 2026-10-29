import { api } from "../api/client";
export const identity = (x) => String(x?._id || x || "");
export const requestId = () => (typeof window !== "undefined" ? window.crypto?.randomUUID?.() : null) || `op-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export async function overview(kind, id, params = {}) {
  if (kind === "enrollment") return (await api.get(`/enrollments/${id}/operating`, { params })).data;
  return (await api.get(`/projects/${id}/operating`, { params })).data;
}
export async function options(kind, id) {
  if (kind === "job") return (await api.get(`/jobs/${id}/operating/options`)).data;
  if (kind === "customer") return (await api.get(`/customers/${id}/operating/options`)).data;
  if (kind === "enrollment") return (await api.get(`/enrollments/${id}/operating/options`)).data;
  return (await api.get(`/projects/${id}/operating/options`)).data;
}
export async function ownerAction(kind, id, command, body = {}) {
  const payload = { requestId: requestId(), ...body };
  if (kind === "enrollment") return (await api.post(`/enrollments/${id}/operating/${command}`, payload)).data;
  return (await api.post(`/projects/${id}/operating/${command}`, payload)).data;
}
export async function periodAction(id, periodId, command, body) { return (await api.post(`/enrollments/${id}/operating/periods/${periodId}/${command}`, { requestId: requestId(), ...body })).data; }
export async function jobAction(job, command, body = {}) { return (await api.post(`/jobs/${job._id}/operating/${command}`, { requestId: requestId(), expectedVersion: job.operating.version, ...body })).data; }
export const errorMessage = (e) => e?.response?.data?.message || e.message || "The action did not save.";
export function localDate(value, zone = "Asia/Dubai") { if (!value) return ""; const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value)).map((x) => [x.type, x.value])); return `${p.year}-${p.month}-${p.day}`; }
