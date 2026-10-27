// Test harness: boots the real Express app with model methods stubbed, so
// authorization rules can be verified without a database. Integration tests
// against a real MongoDB can be added later (mongodb-memory-server).
import "./setup-env.js";
import mongoose from "mongoose";
import { createApp } from "../src/app.js";
import { signToken } from "../src/utils/jwt.js";
import User from "../src/modules/iam/users/user.model.js";
import Role from "../src/modules/iam/roles/role.model.js";
import Audit from "../src/modules/iam/audit/audit.model.js";

mongoose.set("bufferCommands", false);

/** A chainable, awaitable stand-in for a Mongoose query. */
export function q(result) {
  const c = {};
  for (const m of ["select", "lean", "populate", "sort", "skip", "limit", "collation", "session"]) {
    c[m] = () => c;
  }
  const value = () => (typeof result === "function" ? result() : result);
  c.then = (res, rej) => Promise.resolve().then(value).then(res, rej);
  c.exec = () => Promise.resolve().then(value);
  return c;
}

const originals = new Map();
/** Replace a model static for the duration of a test; restore with restoreAll(). */
export function stub(model, method, impl) {
  const key = `${model.modelName}.${method}`;
  if (!originals.has(key)) originals.set(key, [model, method, model[method]]);
  model[method] = impl;
}
export function restoreAll() {
  for (const [, [model, method, fn]] of originals) model[method] = fn;
  originals.clear();
}

export const oid = () => new mongoose.Types.ObjectId().toString();

/**
 * Register fake users and roles for requireAuth. users: [{_id, role, clientId?}]
 * roles: { key: {permissions, isInternal} }
 */
export function setupAuth({ users = [], roles = {} } = {}) {
  const byId = new Map(users.map((u) => [String(u._id), u]));
  stub(User, "findById", (id) => {
    const u = byId.get(String(id));
    return q(
      u
        ? {
            fullName: u.fullName || "Test User",
            email: u.email || `${u.role}@test.local`,
            isActive: true,
            passwordChangedAt: null,
            extraPermissions: [],
            revokedPermissions: [],
            clientId: null,
            ...u,
          }
        : null
    );
  });
  stub(Role, "findOne", (filter = {}) => q(roles[filter.key] ? { key: filter.key, ...roles[filter.key] } : null));
  stub(Audit, "create", async () => ({}));
}

export function tokenFor(user) {
  return signToken({ id: String(user._id), role: user.role });
}

let server;
let base;
export async function startApp() {
  if (server) return base;
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
  return base;
}
export async function stopApp() {
  if (server) await new Promise((r) => server.close(r));
  server = null;
}

export async function call(method, path, { user, body } = {}) {
  const url = (await startApp()) + path;
  const headers = { "content-type": "application/json" };
  if (user) headers.authorization = `Bearer ${tokenFor(user)}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, body: json };
}
