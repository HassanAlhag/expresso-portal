import axios from "axios";

// CRA proxy: /api -> http://localhost:5050
const http = axios.create({ baseURL: "/api" });

export async function listPublicPortfolio(params = {}) {
  const { data } = await http.get("/portfolio", { params });
  return data;
}

export async function getPublicPortfolioBySlug(slug) {
  const { data } = await http.get(`/portfolio/${slug}`);
  return data;
}
