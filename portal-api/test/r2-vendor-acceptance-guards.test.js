// Stage R2 hardening — vendor invitation acceptance guards (separate process
// because of the accept endpoint's rate limit; see r2-vendor-acceptance).
import "./setup-env.js";
import { test, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { restoreAll, stopApp } from "./helpers.js";
import { EMAIL, world, accept } from "./vendorInviteWorld.js";

afterEach(restoreAll);
after(stopApp);

test("acceptance: a deactivated vendor profile cannot be claimed and no account is created", async () => {
  const { db, token } = world({ vendor: { isActive: false } });
  assert.equal((await accept(token)).status, 409);
  assert.equal(db.users.length, 0);
  assert.equal(db.vendors[0].userId, null);
  assert.equal(db.invites[0].status, "cancelled");
});

test("acceptance: an account created another way for the same email is never taken over", async () => {
  const other = { _id: new mongoose.Types.ObjectId(), email: EMAIL, role: "client", passwordHash: "theirs" };
  const { db, token } = world({ users: [other] });
  const r = await accept(token);
  assert.equal(r.status, 409);
  assert.equal(db.users.length, 1);
  assert.equal(db.users[0].passwordHash, "theirs");
  assert.equal(db.vendors[0].userId, null, "the vendor profile is not linked to that account");
  assert.equal(db.invites[0].status, "cancelled");
});

test("acceptance: an expired invitation cannot be used", async () => {
  const { db, token } = world({ invite: { expiresAt: new Date(Date.now() - 1000) } });
  assert.equal((await accept(token)).status, 400);
  assert.equal(db.users.length, 0);
});

test("acceptance: an unknown token cannot be used", async () => {
  const { db } = world();
  assert.equal((await accept("not-a-real-token")).status, 404);
  assert.equal(db.users.length, 0);
});
