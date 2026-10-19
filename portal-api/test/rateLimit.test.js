import "./setup-env.js";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { call, stopApp } from "./helpers.js";

after(stopApp);

test("abusing one public endpoint does not lock out login (audit B9)", async () => {
  for (let i = 0; i < 12; i++) {
    await call("POST", "/api/auth/request-access", { body: {} });
  }
  const limited = await call("POST", "/api/auth/request-access", { body: {} });
  assert.equal(limited.status, 429);
  const login = await call("POST", "/api/auth/login", { body: {} });
  assert.equal(login.status, 400); // validation error, not 429
});
