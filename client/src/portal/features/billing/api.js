import { api } from "../../shared/api/client";

const BASE = "/billing";

export async function getBillingStats() {
  const { data } = await api.get(`${BASE}/stats`);
  return data;
}

export async function listInvoices(params = {}) {
  const { data } = await api.get(`${BASE}/invoices`, { params });
  return data;
}

export async function getInvoice(id) {
  const { data } = await api.get(`${BASE}/invoices/${id}`);
  return data;
}

export async function createInvoice(payload) {
  const { data } = await api.post(`${BASE}/invoices`, payload);
  return data;
}

export async function updateInvoice(id, payload) {
  const { data } = await api.patch(`${BASE}/invoices/${id}`, payload);
  return data;
}

export async function markInvoicePaid(id) {
  const { data } = await api.post(`${BASE}/invoices/${id}/mark-paid`, {});
  return data;
}

export async function voidInvoice(id) {
  const { data } = await api.post(`${BASE}/invoices/${id}/void`, {});
  return data;
}

export async function recordPayment(id, payload) {
  const { data } = await api.post(`${BASE}/invoices/${id}/payments`, payload);
  return data;
}

export async function deletePayment(id, payId) {
  const { data } = await api.delete(`${BASE}/invoices/${id}/payments/${payId}`);
  return data;
}

export async function markOverdueInvoices() {
  const { data } = await api.post(`${BASE}/invoices/mark-overdue`, {});
  return data;
}
