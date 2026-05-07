import axios from "axios";

// Uses CRA proxy "/api" -> "http://localhost:5050"
const http = axios.create({ baseURL: "/api" });

export async function listProductions(params = {}) {
  const { data } = await http.get("/productions", { params });
  return data;
}

export async function getProductionBySlug(slug) {
  const { data } = await http.get(`/productions/${slug}`);
  return data;
}
