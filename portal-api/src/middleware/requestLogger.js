import morgan from "morgan";
import { env } from "../config/env.js";

// Request URLs can carry one-time secrets: invite tokens
// (/api/invites/verify?token=…), and signed private-file links
// (/api/private-files/<token>). The browser's Referer can also carry the
// portal page URL, e.g. /portal/accept-invite?token=… or
// /portal/reset-password?token=…. Logs must never contain them, so every
// query string is dropped and token path segments are replaced.
const TOKEN_PATHS = [/(\/api\/private-files\/)[^/?#]+/];

export function redactUrl(value) {
  if (!value || value === "-") return value;
  let out = String(value);
  const q = out.search(/[?#]/);
  if (q !== -1) out = out.slice(0, q) + "?[redacted]";
  for (const rx of TOKEN_PATHS) out = out.replace(rx, "$1[redacted]");
  return out;
}

morgan.token("safe-url", (req) => redactUrl(req.originalUrl || req.url));
morgan.token("safe-referrer", (req) => redactUrl(req.headers.referer || req.headers.referrer || "-"));

// Same fields as morgan's "combined" and "dev" formats, with the URL and
// referrer redacted.
export const PRODUCTION_FORMAT =
  ':remote-addr - :remote-user [:date[clf]] ":method :safe-url HTTP/:http-version" :status :res[content-length] ":safe-referrer" ":user-agent"';
export const DEVELOPMENT_FORMAT = ":method :safe-url :status :response-time ms - :res[content-length]";

export function createRequestLogger({ production = env.nodeEnv === "production", stream } = {}) {
  return morgan(production ? PRODUCTION_FORMAT : DEVELOPMENT_FORMAT, stream ? { stream } : undefined);
}

export const requestLogger = createRequestLogger();
