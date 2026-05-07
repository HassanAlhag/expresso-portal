import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("portal_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const listCareers    = ()         => api.get("/careers").then(r => r.data);
export const createCareer   = (data)     => api.post("/careers", data).then(r => r.data);
export const updateCareer   = (id, data) => api.patch(`/careers/${id}`, data).then(r => r.data);
export const deleteCareer   = (id)       => api.delete(`/careers/${id}`).then(r => r.data);

// Applications
export const listAllApplications     = (params = {}) => api.get("/careers/applications", { params }).then(r => r.data);
export const listApplicationsForJob  = (id, params = {}) => api.get(`/careers/${id}/applications`, { params }).then(r => r.data);
export const updateApplicationStatus = (id, payload) => api.patch(`/careers/applications/${id}/status`, payload).then(r => r.data);

// Homepage slides
export const listSlides   = ()         => api.get("/homepage/slides").then(r => r.data);
export const createSlide  = (data)     => api.post("/homepage/slides", data).then(r => r.data);
export const updateSlide  = (id, data) => api.patch(`/homepage/slides/${id}`, data).then(r => r.data);
export const deleteSlide  = (id)       => api.delete(`/homepage/slides/${id}`).then(r => r.data);
