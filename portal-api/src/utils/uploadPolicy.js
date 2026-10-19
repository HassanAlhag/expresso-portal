import path from "path";

// File types that must never be accepted as uploads: executables, scripts and
// active web content (which could run if opened inline from storage). Audit S9.
const BLOCKED_EXTENSIONS = new Set([
  ".exe", ".msi", ".dll", ".com", ".scr", ".bat", ".cmd", ".ps1", ".vbs", ".sh",
  ".jar", ".app", ".js", ".mjs", ".cjs", ".php", ".py", ".pl", ".rb",
  ".html", ".htm", ".xhtml", ".svg", ".svgz", ".xml", ".hta",
]);
const BLOCKED_MIME = [
  "text/html",
  "application/xhtml+xml",
  "image/svg+xml",
  "application/javascript",
  "text/javascript",
  "application/x-msdownload",
  "application/x-sh",
];

export function isBlockedUpload(file, { allowSvg = false } = {}) {
  const ext = path.extname(String(file?.originalname || "")).toLowerCase();
  const mime = String(file?.mimetype || "").toLowerCase();
  if (allowSvg && (ext === ".svg" || mime === "image/svg+xml")) return false;
  return BLOCKED_EXTENSIONS.has(ext) || BLOCKED_MIME.some((m) => mime.startsWith(m));
}

/** multer fileFilter for documents: rejects blocked types (400). */
export function uploadFileFilter(_req, file, cb) {
  if (isBlockedUpload(file)) {
    const err = new Error(`File type not allowed: ${file.originalname}`);
    err.statusCode = 400;
    return cb(err);
  }
  return cb(null, true);
}

/**
 * Media library (public website assets): same policy, but SVG logos/icons are
 * allowed because they are served from the storage domain, not the app's.
 */
export function mediaFileFilter(_req, file, cb) {
  if (isBlockedUpload(file, { allowSvg: true })) {
    const err = new Error(`File type not allowed: ${file.originalname}`);
    err.statusCode = 400;
    return cb(err);
  }
  return cb(null, true);
}
