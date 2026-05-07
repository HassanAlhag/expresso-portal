import { api } from "../../shared/api/client";

export async function listFiles(params = {}) {
  const { data } = await api.get("/files", { params });
  return data;
}

export async function getFile(id) {
  const { data } = await api.get(`/files/${id}`);
  return data;
}

export async function uploadFiles({
  files = [],
  customerId = "",
  projectId = "",
  jobId = "",
  productionId = "",
  visibility = "internal",
  approved = false,
  title = "",
  notes = "",
  tags = "",
}) {
  const form = new FormData();

  files.forEach((file) => {
    form.append("files", file);
  });

  if (customerId) form.append("customerId", customerId);
  if (projectId) form.append("projectId", projectId);
  if (jobId) form.append("jobId", jobId);
  if (productionId) form.append("productionId", productionId);

  form.append("visibility", visibility);
  form.append("approved", String(approved));
  form.append("title", title);
  form.append("notes", notes);
  form.append("tags", tags);

  const { data } = await api.post("/files", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
}

export async function updateFile(id, payload) {
  const { data } = await api.patch(`/files/${id}`, payload);
  return data;
}

export async function deleteFile(id) {
  const { data } = await api.delete(`/files/${id}`);
  return data;
}
