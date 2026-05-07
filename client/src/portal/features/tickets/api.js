import { api } from "../../shared/api/client";

export async function getTicketStats() {
  const { data } = await api.get("/tickets/stats");
  return data;
}

export async function listTickets(params = {}) {
  const { data } = await api.get("/tickets", { params });
  return data;
}

export async function createTicket(payload) {
  const { data } = await api.post("/tickets", payload);
  return data;
}

export async function getTicket(id) {
  const { data } = await api.get(`/tickets/${id}`);
  return data;
}

export async function updateTicket(id, payload) {
  const { data } = await api.patch(`/tickets/${id}`, payload);
  return data;
}

export async function addTicketComment(id, payload) {
  const { data } = await api.post(`/tickets/${id}/comments`, payload);
  return data;
}

export async function updateTicketStatus(id, status, resolution) {
  const { data } = await api.patch(`/tickets/${id}/status`, { status, resolution });
  return data;
}

export async function approveTicket(id, decision, note) {
  const { data } = await api.patch(`/tickets/${id}/approve`, { decision, note });
  return data;
}
