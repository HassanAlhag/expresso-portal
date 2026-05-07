import { api } from "../../shared/api/client";

const BASE = "/procurement";

// ── Categories ────────────────────────────────────────────────────────────────

export async function listCategories(params = {}) {
  const { data } = await api.get(`${BASE}/categories`, { params });
  return data;
}

export async function createCategory(payload) {
  const { data } = await api.post(`${BASE}/categories`, payload);
  return data;
}

export async function updateCategory(id, payload) {
  const { data } = await api.patch(`${BASE}/categories/${id}`, payload);
  return data;
}

export async function deleteCategory(id) {
  const { data } = await api.delete(`${BASE}/categories/${id}`);
  return data;
}

// ── Vendors ───────────────────────────────────────────────────────────────────

export async function listVendors(params = {}) {
  const { data } = await api.get(`${BASE}/vendors`, { params });
  return data;
}

export async function createVendor(payload) {
  const { data } = await api.post(`${BASE}/vendors`, payload);
  return data;
}

export async function updateVendor(id, payload) {
  const { data } = await api.patch(`${BASE}/vendors/${id}`, payload);
  return data;
}

export async function deleteVendor(id) {
  const { data } = await api.delete(`${BASE}/vendors/${id}`);
  return data;
}

// ── Requests ──────────────────────────────────────────────────────────────────

export async function listRequests(params = {}) {
  const { data } = await api.get(`${BASE}/requests`, { params });
  return data;
}

export async function getRequest(id) {
  const { data } = await api.get(`${BASE}/requests/${id}`);
  return data;
}

export async function createRequest(payload) {
  const { data } = await api.post(`${BASE}/requests`, payload);
  return data;
}

export async function updateRequest(id, payload) {
  const { data } = await api.patch(`${BASE}/requests/${id}`, payload);
  return data;
}

export async function deleteRequest(id) {
  const { data } = await api.delete(`${BASE}/requests/${id}`);
  return data;
}

export async function createRfqFromRequest(id) {
  const { data } = await api.post(`${BASE}/requests/${id}/create-rfq`);
  return data;
}

export async function listCustomers(params = {}) {
  const { data } = await api.get("/customers", { params });
  return data;
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getProcurementStats() {
  const { data } = await api.get(`${BASE}/requests/stats`);
  return data;
}

// ── Category tree ─────────────────────────────────────────────────────────────

export async function getCategoryTree() {
  const { data } = await api.get(`${BASE}/categories/tree`);
  return data;
}

// ── Vendor Applications ───────────────────────────────────────────────────────

export async function listVendorApplications(params = {}) {
  const { data } = await api.get("/vendor-applications", { params });
  return data;
}

export async function getVendorApplication(id) {
  const { data } = await api.get(`/vendor-applications/${id}`);
  return data;
}

export async function approveVendorApplication(id) {
  const { data } = await api.patch(`/vendor-applications/${id}/approve`);
  return data;
}

export async function rejectVendorApplication(id, payload = {}) {
  const { data } = await api.patch(
    `/vendor-applications/${id}/reject`,
    payload
  );
  return data;
}

// ── RFQs ──────────────────────────────────────────────────────────────────────

export async function listRfqs(params = {}) {
  const { data } = await api.get(`${BASE}/rfqs`, { params });
  return data;
}

export async function getRfq(id) {
  const { data } = await api.get(`${BASE}/rfqs/${id}`);
  return data;
}

export async function createRfq(payload) {
  const { data } = await api.post(`${BASE}/rfqs`, payload);
  return data;
}

export async function updateRfq(id, payload) {
  const { data } = await api.patch(`${BASE}/rfqs/${id}`, payload);
  return data;
}

export async function publishRfq(id, payload = {}) {
  const { data } = await api.patch(`${BASE}/rfqs/${id}/publish`, payload);
  return data;
}

export async function closeRfq(id) {
  const { data } = await api.patch(`${BASE}/rfqs/${id}/close`);
  return data;
}

export async function getMatchedVendors(id) {
  const { data } = await api.get(`${BASE}/rfqs/${id}/matched-vendors`);
  return data;
}

// ── Quotations ────────────────────────────────────────────────────────────────

export async function listQuotations(rfqId) {
  const { data } = await api.get(`${BASE}/rfqs/${rfqId}/quotations`);
  return data;
}

export async function submitQuotation(rfqId, payload) {
  const { data } = await api.post(`${BASE}/rfqs/${rfqId}/quotations`, payload);
  return data;
}

export async function updateQuotationStatus(quotationId, status) {
  const { data } = await api.patch(
    `${BASE}/rfqs/quotations/${quotationId}/status`,
    { status }
  );
  return data;
}
