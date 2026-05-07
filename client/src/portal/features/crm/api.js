import { api } from "../../shared/api/client";

// ── Deals ─────────────────────────────────────────────────────────────────────

export async function listDeals(params = {}) {
  const { data } = await api.get("/crm/deals", { params });
  return data;
}

export async function getDeal(id) {
  const { data } = await api.get(`/crm/deals/${id}`);
  return data;
}

export async function createDeal(payload) {
  const { data } = await api.post("/crm/deals", payload);
  return data;
}

export async function updateDeal(id, payload) {
  const { data } = await api.patch(`/crm/deals/${id}`, payload);
  return data;
}

export async function deleteDeal(id) {
  const { data } = await api.delete(`/crm/deals/${id}`);
  return data;
}

export async function convertDealToCustomer(id) {
  const { data } = await api.post(`/crm/deals/${id}/convert-to-customer`);
  return data;
}

// ── Leads ─────────────────────────────────────────────────────────────────────

export async function listLeads(params = {}) {
  const { data } = await api.get("/crm/leads", { params });
  return data;
}

export async function getLead(id) {
  const { data } = await api.get(`/crm/leads/${id}`);
  return data;
}

export async function createLead(payload) {
  const { data } = await api.post("/crm/leads", payload);
  return data;
}

export async function updateLead(id, payload) {
  const { data } = await api.patch(`/crm/leads/${id}`, payload);
  return data;
}

export async function deleteLead(id) {
  const { data } = await api.delete(`/crm/leads/${id}`);
  return data;
}

export async function convertLeadToDeal(id, payload = {}) {
  const { data } = await api.post(`/crm/leads/${id}/convert`, payload);
  return data;
}

// ── Accounts ──────────────────────────────────────────────────────────────────

export async function listAccounts(params = {}) {
  const { data } = await api.get("/crm/accounts", { params });
  return data;
}

export async function getAccount(id) {
  const { data } = await api.get(`/crm/accounts/${id}`);
  return data;
}

export async function createAccount(payload) {
  const { data } = await api.post("/crm/accounts", payload);
  return data;
}

export async function updateAccount(id, payload) {
  const { data } = await api.patch(`/crm/accounts/${id}`, payload);
  return data;
}

export async function deleteAccount(id) {
  const { data } = await api.delete(`/crm/accounts/${id}`);
  return data;
}

// ── Contacts ──────────────────────────────────────────────────────────────────

export async function listContacts(params = {}) {
  const { data } = await api.get("/crm/contacts", { params });
  return data;
}

export async function getContact(id) {
  const { data } = await api.get(`/crm/contacts/${id}`);
  return data;
}

export async function createContact(payload) {
  const { data } = await api.post("/crm/contacts", payload);
  return data;
}

export async function updateContact(id, payload) {
  const { data } = await api.patch(`/crm/contacts/${id}`, payload);
  return data;
}

export async function deleteContact(id) {
  const { data } = await api.delete(`/crm/contacts/${id}`);
  return data;
}

// ── Activities ────────────────────────────────────────────────────────────────

export async function listActivities(params = {}) {
  const { data } = await api.get("/crm/activities", { params });
  return data;
}

export async function createActivity(payload) {
  const { data } = await api.post("/crm/activities", payload);
  return data;
}

export async function updateActivity(id, payload) {
  const { data } = await api.patch(`/crm/activities/${id}`, payload);
  return data;
}

export async function deleteActivity(id) {
  const { data } = await api.delete(`/crm/activities/${id}`);
  return data;
}
