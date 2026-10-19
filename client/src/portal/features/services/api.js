// client/src/portal/features/services/api.js
import { api } from "../../shared/api/client";

const BASE = "/service";

export async function listServiceTemplates(params = {}) {
  const { data } = await api.get(BASE, { params });
  return data;
}

export async function createServiceTemplate(payload) {
  const { data } = await api.post(BASE, payload);
  return data;
}

export async function getServiceTemplate(id) {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
}

export async function updateServiceTemplate(id, payload) {
  const { data } = await api.patch(`${BASE}/${id}`, payload);
  return data;
}

export async function deleteServiceTemplate(id) {
  const { data } = await api.delete(`${BASE}/${id}`);
  return data;
}

export async function uploadServiceTemplateFiles(id, files = []) {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));

  const { data } = await api.post(`${BASE}/${id}/files`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
}

// Attachments are private; ask for a short-lived link and open it.
export async function openServiceTemplateFile(templateId, fileId) {
  const tab = window.open("", "_blank");
  if (tab) tab.opener = null;
  try {
    const { data } = await api.get(`${BASE}/${templateId}/files/${fileId}/url`);
    if (!data?.url) throw new Error("File link unavailable");
    if (tab) tab.location.href = data.url;
    else window.location.href = data.url;
  } catch (e) {
    if (tab) tab.close();
    throw e;
  }
}

export const listServices = listServiceTemplates;
export const createService = createServiceTemplate;
export const getService = getServiceTemplate;
export const updateService = updateServiceTemplate;
export const deleteService = deleteServiceTemplate;
