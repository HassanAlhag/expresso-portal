import { api } from "../../shared/api/client";

export async function getProjectStats() {
  const { data } = await api.get("/projects/stats");
  return data;
}

export async function getTicketStats() {
  const { data } = await api.get("/tickets/stats");
  return data;
}

export async function getBillingStats() {
  const { data } = await api.get("/billing/stats");
  return data;
}

export async function getCustomerCount() {
  const { data } = await api.get("/customers", { params: { limit: 1, page: 1 } });
  return data;
}
