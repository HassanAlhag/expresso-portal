import "./setup-env.js";
import { test, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import path from "path";
import { setupAuth, restoreAll, stopApp, stub, q, oid, call, startApp, tokenFor } from "./helpers.js";
import File from "../src/modules/files/file.model.js";
import Application from "../src/modules/careers/application.model.js";
import Career from "../src/modules/careers/career.model.js";
import { LOCAL_PRIVATE_ROOT } from "../src/utils/privateStorage.js";

delete process.env.AWS_S3_BUCKET;
delete process.env.AWS_S3_PRIVATE_BUCKET;

afterEach(restoreAll);
after(async () => {
  await stopApp();
  await fs.rm(path.join(LOCAL_PRIVATE_ROOT, "private"), { recursive: true, force: true });
});

const companyA = oid();
const companyB = oid();
const ops = { _id: oid(), role: "operations_manager" };
const clientA = { _id: oid(), role: "client", clientId: companyA };
const clientB = { _id: oid(), role: "client", clientId: companyB };
const orphanExternal = { _id: oid(), role: "client" }; // no company

async function upload(user, name, content, fields = {}) {
  const base = await startApp();
  const form = new FormData();
  form.append("files", new Blob([content]), name);
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  const res = await fetch(`${base}/api/files`, {
    method: "POST",
    headers: { authorization: `Bearer ${tokenFor(user)}` },
    body: form,
  });
  return { status: res.status, body: await res.json() };
}

test("uploaded files are stored privately with no public url (audit S2)", async () => {
  setupAuth({ users: [ops] });
  let inserted;
  stub(File, "insertMany", async (docs) => {
    inserted = docs;
    return docs.map((d) => ({ _id: oid(), ...d }));
  });
  const r = await upload(ops, "contract.pdf", "PDF-DATA", { customerId: companyA, visibility: "client" });
  assert.equal(r.status, 201);
  assert.equal(inserted[0].url, "");
  assert.equal(inserted[0].isPrivate, true);
  assert.match(inserted[0].filename, /^private\/files\//);
  const onDisk = await fs.readFile(path.join(LOCAL_PRIVATE_ROOT, inserted[0].filename), "utf8");
  assert.equal(onDisk, "PDF-DATA");
});

test("dangerous file types are rejected (audit S9)", async () => {
  setupAuth({ users: [ops] });
  stub(File, "insertMany", async (docs) => docs);
  const r = await upload(ops, "invoice.html", "<script>alert(1)</script>");
  assert.equal(r.status, 400);
});

test("signed link is issued only to the owning company and works once issued", async () => {
  setupAuth({ users: [ops, clientA, clientB] });
  let inserted;
  stub(File, "insertMany", async (docs) => {
    inserted = docs.map((d) => ({ _id: oid(), ...d }));
    return inserted;
  });
  await upload(ops, "report.pdf", "REPORT", { customerId: companyA, visibility: "client" });
  const doc = { ...inserted[0], customerId: companyA, visibility: "client" };
  stub(File, "findById", () => q(doc));

  const other = await call("GET", `/api/files/${doc._id}/download-url`, { user: clientB });
  assert.equal(other.status, 403);

  const own = await call("GET", `/api/files/${doc._id}/download-url`, { user: clientA });
  assert.equal(own.status, 200);
  assert.match(own.body.url, /\/api\/private-files\//);

  const res = await fetch(own.body.url.replace(/^http:\/\/localhost:\d+/, await startApp()));
  assert.equal(res.status, 200);
  assert.equal(await res.text(), "REPORT");

  const forged = await fetch(`${await startApp()}/api/private-files/not-a-token`);
  assert.equal(forged.status, 404);
});

test("external user without a company sees no files", async () => {
  setupAuth({ users: [orphanExternal] });
  let queried = false;
  stub(File, "find", () => {
    queried = true;
    return q([]);
  });
  stub(File, "countDocuments", () => q(0));
  const r = await call("GET", "/api/files", { user: orphanExternal });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.items, []);
  assert.equal(queried, false);
});

test("CVs are stored privately and forged keys are ignored", async () => {
  const base = await startApp();
  const form = new FormData();
  form.append("cv", new Blob(["CV"]), "jane.pdf");
  const up = await fetch(`${base}/api/careers/cv-upload`, { method: "POST", body: form });
  const upBody = await up.json();
  assert.equal(up.status, 200);
  assert.match(upBody.cvKey, /^private\/cvs\//);
  assert.equal(upBody.cvUrl, undefined);

  const careerId = oid();
  stub(Career, "findById", () => q({ _id: careerId, isActive: true }));
  let created;
  stub(Application, "create", async (doc) => {
    created = doc;
    return { toObject: () => ({ ...doc }) };
  });
  const forged = await call("POST", `/api/careers/${careerId}/apply`, {
    body: { fullName: "X", email: "x@test.local", cvKey: "private/files/someone-elses.pdf" },
  });
  assert.equal(forged.status, 201);
  assert.equal(created.cvKey, "");
  assert.equal(forged.body.item.cvKey, undefined);
});
