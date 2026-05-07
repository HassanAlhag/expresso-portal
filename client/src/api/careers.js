import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5050/api",
});

export async function listPublicCareers() {
  const res = await api.get("/careers/public");
  return res.data;
}

export async function uploadCV(file) {
  const form = new FormData();
  form.append("cv", file);
  const res = await api.post("/careers/cv-upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function applyForCareer(careerId, payload) {
  const res = await api.post(`/careers/${careerId}/apply`, payload);
  return res.data;
}
