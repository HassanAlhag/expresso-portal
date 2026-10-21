// Stage R2 hardening — vendor invitation acceptance: single use, concurrent
// submissions, failed linking, and completing an interrupted acceptance.
// Runs through the real Express app; collections are in-memory (fakeStore.js).
// The accept endpoint allows 10 requests per 15 minutes per process, so each
// acceptance test file keeps its accept calls at or below that.
import "./setup-env.js";
import { test, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { restoreAll, stopApp } from "./helpers.js";
import { EMAIL, OLD, world, accept } from "./vendorInviteWorld.js";

afterEach(restoreAll);
after(stopApp);

test("acceptance: creates one vendor account, links it to the profile, and the link cannot be used again", async () => {
  const { db, token, vendorId } = world();
  const r = await accept(token);
  assert.equal(r.status, 201);
  assert.equal(db.users.length, 1);
  const user = db.users[0];
  assert.equal(user.role, "vendor");
  assert.equal(user.email, EMAIL);
  assert.equal(String(db.vendors[0].userId), String(user._id));
  assert.equal(String(db.apps[0].userId), String(user._id));
  assert.equal(db.invites[0].status, "accepted");
  assert.equal(String(db.invites[0].acceptedByUserId), String(user._id));
  assert.ok(!/password/i.test(JSON.stringify(r.body)));
  assert.equal(String(db.vendors[0]._id), String(vendorId));

  const again = await accept(token);
  assert.equal(again.status, 409, "a used invitation cannot be accepted again");
  assert.equal(db.users.length, 1);
});

test("acceptance: two concurrent submissions of the same invitation create one account", async () => {
  const { db, token } = world();
  const [a, b] = await Promise.all([accept(token), accept(token)]);
  assert.deepEqual([a.status, b.status].sort(), [201, 409]);
  assert.equal(db.users.length, 1);
  assert.equal(String(db.vendors[0].userId), String(db.users[0]._id));
  assert.equal(db.invites[0].status, "accepted");
});

test("acceptance: if the vendor profile cannot be linked, no account is created and the invitation is cancelled", async () => {
  const otherUser = new mongoose.Types.ObjectId();
  const { db, token } = world({ vendor: { userId: otherUser } });
  const r = await accept(token);
  assert.equal(r.status, 409);
  assert.equal(db.users.length, 0, "no login exists");
  assert.equal(String(db.vendors[0].userId), String(otherUser), "the existing link is untouched");
  assert.equal(db.invites[0].status, "cancelled");
});

test("acceptance: if creating the account fails, no login exists and the same link completes it later", async () => {
  const { db, token } = world({ failures: { "users.create": 1 } });
  const first = await accept(token);
  assert.equal(first.status, 500);
  assert.equal(db.users.length, 0, "no login exists after the failure");
  const reserved = db.invites[0].acceptedByUserId;
  assert.ok(reserved, "the reserved account id is recorded on the invitation");
  assert.equal(db.invites[0].status, "pending");
  assert.equal(db.invites[0].acceptedAt, null, "claim released so the vendor can retry");
  // Detectable partial state: the profile points at an account id that does not exist yet.
  assert.equal(String(db.vendors[0].userId), String(reserved));

  const retry = await accept(token);
  assert.equal(retry.status, 201);
  assert.equal(db.users.length, 1);
  assert.equal(String(db.users[0]._id), String(reserved), "retry converges on the reserved account id");
  assert.equal(String(db.vendors[0].userId), String(reserved));
  assert.equal(db.invites[0].status, "accepted");
});

test("acceptance: an acceptance interrupted after the account was created is completed by the same link", async () => {
  const reserved = new mongoose.Types.ObjectId();
  const { db, token } = world({
    invite: { acceptedAt: OLD(), acceptedByUserId: reserved },
    vendor: { userId: reserved },
    users: [{ _id: reserved, email: EMAIL, role: "vendor", isActive: true, passwordHash: "old" }],
  });
  const r = await accept(token);
  assert.equal(r.status, 201);
  assert.equal(db.users.length, 1, "no second account");
  assert.notEqual(db.users[0].passwordHash, "old", "the password just chosen applies");
  assert.equal(db.invites[0].status, "accepted");
});

test("acceptance: an acceptance still in progress blocks a second submission", async () => {
  const { db, token } = world({ invite: { acceptedAt: new Date(), acceptedByUserId: new mongoose.Types.ObjectId() } });
  const r = await accept(token);
  assert.equal(r.status, 409);
  assert.equal(db.users.length, 0);
  assert.equal(db.vendors[0].userId, null);
});
