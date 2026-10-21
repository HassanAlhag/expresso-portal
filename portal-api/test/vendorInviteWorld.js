// Shared fixture for the vendor invitation acceptance tests: one approved
// vendor application, its unlinked vendor profile and a pending vendor
// invitation, held in memory (fakeStore.js). No database is used.
import crypto from "crypto";
import mongoose from "mongoose";
import { setupAuth, call } from "./helpers.js";
import { fakeCollections } from "./fakeStore.js";
import { ACCEPT_CLAIM_STALE_MS } from "../src/modules/iam/invites/invite.controller.js";
import User from "../src/modules/iam/users/user.model.js";
import Invite from "../src/modules/iam/invites/invite.model.js";
import ProcurementVendor from "../src/modules/procurement/vendor.model.js";
import VendorApplication from "../src/modules/procurement/vendor-application.model.js";

export const EMAIL = "sara@acme.example";
export const OLD = () => new Date(Date.now() - ACCEPT_CLAIM_STALE_MS - 60_000);
const sha = (t) => crypto.createHash("sha256").update(t).digest("hex");

export function world({ invite = {}, vendor = {}, users = [], failures = {} } = {}) {
  const vendorId = new mongoose.Types.ObjectId();
  const token = crypto.randomBytes(16).toString("hex");
  const db = {
    vendors: [{ _id: vendorId, name: "Acme", userId: null, isActive: true, ...vendor }],
    apps: [{ _id: new mongoose.Types.ObjectId(), status: "approved", vendorId, userId: null }],
    users,
    invites: [
      {
        _id: new mongoose.Types.ObjectId(),
        email: EMAIL,
        fullName: "Sara Vendor",
        role: "vendor",
        status: "pending",
        tokenHash: sha(token),
        expiresAt: new Date(Date.now() + 86400000),
        acceptedAt: null,
        acceptedByUserId: null,
        vendorId,
        clientId: null,
        team: "",
        ...invite,
      },
    ],
  };
  fakeCollections(
    db,
    { vendors: ProcurementVendor, apps: VendorApplication, users: User, invites: Invite },
    { failures, uniqueEmail: ["users"] }
  );
  setupAuth({});
  return { db, token, vendorId };
}

export const accept = (token) =>
  call("POST", "/api/invites/accept", { body: { token, password: "a-strong-password", fullName: "Sara" } });

