// client/src/api/websiteProductions.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
});

export async function listWebsiteReels() {
  const res = await api.get("/jobs/public/website", {
    params: {
      type: "reel",
      limit: 50,
      page: 1,
      sort: "-publishedAt",
    },
  });

  return res.data;
}
