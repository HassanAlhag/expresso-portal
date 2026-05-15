import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
});

export async function getCategoryTree() {
  const res = await api.get("/procurement/categories/tree");
  return res.data;
}

export async function submitVendorApplication(payload) {
  const res = await api.post("/vendor-applications", payload);
  return res.data;
}
