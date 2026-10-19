import { api } from "../../shared/api/client";

export const listSlides = () =>
  api.get("/homepage/slides").then((res) => res.data);

export const createSlide = (data) =>
  api.post("/homepage/slides", data).then((res) => res.data);

export const updateSlide = (id, data) =>
  api.patch(`/homepage/slides/${id}`, data).then((res) => res.data);

export const deleteSlide = (id) =>
  api.delete(`/homepage/slides/${id}`).then((res) => res.data);

export const getSiteSettings = () =>
  api.get("/site-settings").then((res) => res.data);

export const updateSiteSettings = (section, data) =>
  api.patch("/site-settings", { section, data }).then((res) => res.data);

// ─── Digital Services ─────────────────────────────────────────────────────────
export const listDigitalServices = (params = {}) =>
  api.get("/web-content/services", { params }).then((r) => r.data);
export const createDigitalService = (data) =>
  api.post("/web-content/services", data).then((r) => r.data);
export const updateDigitalService = (id, data) =>
  api.patch(`/web-content/services/${id}`, data).then((r) => r.data);
export const deleteDigitalService = (id) =>
  api.delete(`/web-content/services/${id}`).then((r) => r.data);
export const reorderDigitalServices = (ids) =>
  api.patch("/web-content/services/reorder", { ids }).then((r) => r.data);

// ─── Technology Solutions ─────────────────────────────────────────────────────
export const listSolutions = (params = {}) =>
  api.get("/web-content/solutions", { params }).then((r) => r.data);
export const createSolution = (data) =>
  api.post("/web-content/solutions", data).then((r) => r.data);
export const updateSolution = (id, data) =>
  api.patch(`/web-content/solutions/${id}`, data).then((r) => r.data);
export const deleteSolution = (id) =>
  api.delete(`/web-content/solutions/${id}`).then((r) => r.data);
export const reorderSolutions = (ids) =>
  api.patch("/web-content/solutions/reorder", { ids }).then((r) => r.data);
