import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("portal_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const listSlides = () =>
  api.get("/homepage/slides").then((res) => res.data);

export const createSlide = (data) =>
  api.post("/homepage/slides", data).then((res) => res.data);

export const updateSlide = (id, data) =>
  api.patch(`/homepage/slides/${id}`, data).then((res) => res.data);

export const deleteSlide = (id) =>
  api.delete(`/homepage/slides/${id}`).then((res) => res.data);
