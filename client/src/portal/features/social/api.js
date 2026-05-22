import { api } from "../../shared/api/client";

/* Social Metrics */
export const listSocialMetrics = (params = {}) =>
  api.get("/social-metrics", { params }).then((r) => r.data);

export const upsertSocialMetrics = (payload) =>
  api.post("/social-metrics", payload).then((r) => r.data);

export const deleteSocialMetrics = (id) =>
  api.delete(`/social-metrics/${id}`).then((r) => r.data);
