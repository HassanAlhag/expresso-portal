// Shared fixtures for the R5-D1 lifecycle tests. No database, S3 or
// environment is used: every target below is a string that is parsed only.

export const LOCAL_URI = "mongodb://127.0.0.1:27999/expresso_lifecycle_fixture?replicaSet=rs0";
export const LOCAL_URI_WITH_CREDS = "mongodb://fixture_user:fixture-pass-123@127.0.0.1:27999/expresso_lifecycle_fixture?replicaSet=rs0";

export const profilesDoc = () => ({
  schemaVersion: "expresso.lifecycle.profiles/1",
  profiles: [
    {
      alias: "local-fixture",
      class: "local",
      connection: { scheme: "mongodb", hosts: ["127.0.0.1:27999"], database: "expresso_lifecycle_fixture", replicaSet: "rs0" },
      operations: ["inventory"],
    },
    {
      alias: "local-no-ops",
      class: "disposable",
      connection: { scheme: "mongodb", hosts: ["127.0.0.1:27998"], database: "expresso_disposable" },
      operations: [],
    },
    {
      alias: "prod",
      class: "production",
      connection: { scheme: "mongodb+srv", hosts: ["cluster0.example.mongodb.net"], database: "expresso" },
      operations: ["inventory"],
    },
    {
      alias: "staging",
      class: "staging",
      connection: { scheme: "mongodb+srv", hosts: ["staging.example.mongodb.net"], database: "expresso_staging" },
      operations: ["inventory"],
    },
    {
      alias: "local-prodname",
      class: "local",
      connection: { scheme: "mongodb", hosts: ["127.0.0.1:27017"], database: "expresso_prod" },
      operations: ["inventory"],
    },
  ],
});

// Small inventory/classification pair standing in for the generated docs.
export const miniInventory = () => ({
  models: [
    { name: "User", collection: "users", indexes: [{}, {}] },
    { name: "Invite", collection: "invites", indexes: [{}] },
    { name: "Media", collection: "media", indexes: [] },
    { name: "File", collection: "files", indexes: [] },
    { name: "Audit", collection: "audits", indexes: [] },
    { name: "Team", collection: "teams", indexes: [] },
    { name: "Solution", collection: "solutions", indexes: [] },
    { name: "Invoice", collection: "invoices", indexes: [] },
    { name: "JobApplication", collection: "jobapplications", indexes: [] },
    { name: "ServiceTemplate", collection: "servicetemplates", indexes: [] },
    { name: "HRExpense", collection: "hrexpenses", indexes: [] },
    { name: "Quotation", collection: "quotations", indexes: [] },
    { name: "RFQ", collection: "rfqs", indexes: [] },
    { name: "BrandAsset", collection: "brandassets", indexes: [] },
    { name: "Customer", collection: "customers", indexes: [] },
    { name: "Job", collection: "jobs", indexes: [] },
    { name: "Production", collection: "productions", indexes: [] },
    { name: "Portfolio", collection: "portfolios", indexes: [] },
    { name: "WorkItem", collection: "workitems", indexes: [] },
    { name: "HeroSlide", collection: "heroslides", indexes: [] },
    { name: "DigitalService", collection: "digitalservices", indexes: [] },
    { name: "SiteSettings", collection: "sitesettings", indexes: [] },
    { name: "ProcurementCategory", collection: "procurementcategories", indexes: [] },
  ],
});
export const miniClassification = () => ({
  User: "SYSTEM", Invite: "BUSINESS", Media: "CMS", File: "BUSINESS", Audit: "LOG/AUDIT", Team: "CONFIGURATION",
  Solution: "CMS", Invoice: "BUSINESS", JobApplication: "BUSINESS", ServiceTemplate: "CONFIGURATION", HRExpense: "BUSINESS",
  Quotation: "BUSINESS", RFQ: "BUSINESS", BrandAsset: "BUSINESS", Customer: "BUSINESS", Job: "BUSINESS", Production: "CMS",
  Portfolio: "CMS", WorkItem: "CMS", HeroSlide: "CMS", DigitalService: "CMS", SiteSettings: "CONFIGURATION", ProcurementCategory: "CONFIGURATION",
});

export const snapshotFor = (fingerprint, collections) => ({
  schemaVersion: "expresso.lifecycle.observed/1",
  targetFingerprint: fingerprint,
  capturedAt: "2026-10-27T08:00:00Z",
  server: { version: "8.0.4", topology: "replica-set" },
  collections,
});

export const FIXED_NOW = () => new Date("2026-10-27T09:00:00.000Z");

const H = (c) => c.repeat(64);
/** A well-formed, sealed backup manifest (describes no real backup). */
export function manifestBody() {
  return {
    schemaVersion: "expresso.lifecycle.manifest/1",
    operationId: "bk-20261027-0001",
    kind: "backup",
    source: { profileAlias: "local-fixture", profileClass: "local", fingerprint: H("a") },
    time: { startedAt: "2026-10-27T08:00:00Z", completedAt: "2026-10-27T08:05:00.250Z", consistency: { method: "oplog-consistent", clusterTime: "7430000000000000001" } },
    application: { gitCommit: "f".repeat(40), dirty: false, catalogVersion: H("b"), toolVersion: "r5-d1.1", lockfiles: [{ path: "portal-api/package-lock.json", sha256: H("c") }] },
    database: {
      name: "expresso_lifecycle_fixture",
      topology: "replica-set",
      serverVersion: "8.0.4",
      collections: [
        { name: "users", options: {}, count: 3, fingerprint: H("d"), indexes: [{ name: "_id_", key: { _id: 1 } }, { name: "email_1", key: { email: 1 } }] },
        { name: "invites", options: {}, count: 0, indexes: [{ name: "tokenHash_1", key: { tokenHash: 1 } }] },
      ],
    },
    objectStorage: { stores: [{ store: "public", provider: "local", namespace: "uploads", objects: [{ key: "media/2026/a.jpg", bytes: 1024, sha256: H("e"), versionId: null }] }] },
    artifacts: [
      { path: "db/users.bson.gz", bytes: 2048, sha256: H("1"), component: "database", encryption: { scheme: "age", keyRef: "vault:lifecycle/backup-key" } },
      { path: "storage/public-objects.jsonl", bytes: 512, sha256: H("2"), component: "object-storage-public", encryption: null },
    ],
    completion: {
      requiredComponents: ["database", "object-storage-public", "application-metadata"],
      completedComponents: ["database", "object-storage-public", "application-metadata"],
      exclusions: [],
      failures: [],
      captureMethod: "mongodump",
      state: "complete",
    },
  };
}
