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

// Private files have no public url; ask the API for a short-lived link.
export async function getFileDownloadUrl(id) {
  const { data } = await api.get(`/files/${id}/download-url`);
  return data;
}

export async function getFileDownloadUrls(ids = []) {
  if (!ids.length) return { urls: {} };
  const { data } = await api.get("/files/download-urls", {
    params: { ids: ids.join(",") },
  });
  return data;
}

/**
 * Open a file in a new tab. The tab is opened synchronously (so popup blockers
 * allow it) and pointed at the signed link once the API returns it.
 */
export async function openFile(file) {
  const tab = window.open("", "_blank");
  if (tab) tab.opener = null;
  try {
    const url = file?.isPrivate
      ? (await getFileDownloadUrl(file._id))?.url
      : file?.url;
    if (!url) throw new Error("File link unavailable");
    if (tab) tab.location.href = url;
    else window.location.href = url;
  } catch (e) {
    if (tab) tab.close();
    throw e;
  }
}

/** Attach a usable `src` to each file (signed for private, public otherwise). */
export async function withFileLinks(items = []) {
  const privateIds = items.filter((f) => f?.isPrivate).map((f) => f._id);
  let urls = {};
  if (privateIds.length) {
    try {
      urls = (await getFileDownloadUrls(privateIds))?.urls || {};
    } catch {
      urls = {};
    }
  }
  return items.map((f) => ({ ...f, src: f?.isPrivate ? urls[f._id] || "" : f?.url || "" }));
}
