export function success(res, data, statusCode = 200) {
  return res.status(statusCode).json({ ok: true, ...data });
}

export function fail(res, message, statusCode = 400) {
  return res.status(statusCode).json({ ok: false, message });
}

export function paginated(res, { items, page, pages, total, limit }) {
  return res.json({ ok: true, items, page, pages, total, limit });
}
