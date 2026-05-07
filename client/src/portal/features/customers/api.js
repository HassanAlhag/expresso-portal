import { api } from "../../shared/api/client";

export async function listCustomers(params = {}) {
  const { data } = await api.get("/customers", { params });
  return data; // { ok, items, page, pages, total }
}

export async function createCustomer(payload) {
  const { data } = await api.post("/customers", payload);
  return data;
}

export async function updateCustomer(id, payload) {
  const { data } = await api.patch(`/customers/${id}`, payload);
  return data;
}

export async function deleteCustomer(id) {
  const { data } = await api.delete(`/customers/${id}`);
  return data;
}

export async function createCustomerLogin(id, payload) {
  const { data } = await api.post(`/customers/${id}/create-login`, payload);
  return data;
}

export async function getCustomerById(id) {
  const { data } = await api.get(`/customers/${id}`);
  return data; // { ok, item }
}
