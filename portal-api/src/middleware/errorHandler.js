export function errorHandler(err, req, res, next) {
  // Mongoose field validation failure
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    return res.status(400).json({ ok: false, message });
  }

  // Mongoose invalid ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({ ok: false, message: "Invalid identifier" });
  }

  // MongoDB duplicate key (e.g. unique index violation)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(", ");
    return res
      .status(409)
      .json({ ok: false, message: `Duplicate value for: ${field}` });
  }

  // JWT errors — shouldn't reach here normally but belt-and-suspenders
  if (
    err.name === "JsonWebTokenError" ||
    err.name === "TokenExpiredError" ||
    err.name === "NotBeforeError"
  ) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }

  const isProd = process.env.NODE_ENV === "production";
  console.error(isProd ? `[${err.name}] ${err.message}` : err);

  return res.status(err.statusCode || 500).json({
    ok: false,
    message: isProd ? "Internal server error" : (err.message || "Server error"),
  });
}
