import { api } from "../../shared/api/client";

export const listBrandAssets = (params = {}) =>
  api.get("/brand-kit", { params }).then((r) => r.data);

export const createBrandAsset = (payload) =>
  api.post("/brand-kit", payload).then((r) => r.data);

export const updateBrandAsset = (id, payload) =>
  api.patch(`/brand-kit/${id}`, payload).then((r) => r.data);

export const deleteBrandAsset = (id) =>
  api.delete(`/brand-kit/${id}`).then((r) => r.data);
