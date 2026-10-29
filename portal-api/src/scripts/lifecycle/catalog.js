// R5-D1 — lifecycle catalog and protection metadata.
//
// Not a second schema authority. Collections and models come from the
// repository's generated source inventory (docs/architecture/
// source-inventory.json) and their classes from the reviewed
// docs/architecture/collection-classification.json. This module only maps
// those classes onto the lifecycle classes (A–F) and adds protection flags.
//
// Classification never authorises deletion: in R5-D1 every collection is
// protected and none is reset-eligible. Unknown collections are protected
// and read-only by default.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LifecycleError, EXIT, digestOf, isPlainObject, duplicates } from "./common.js";

export const CATALOG_SCHEMA_VERSION = "expresso.lifecycle.catalog/1";

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(here, "../../../..");
export const DEFAULT_SOURCES = Object.freeze({
  inventory: path.join(REPO_ROOT, "docs/architecture/source-inventory.json"),
  classification: path.join(REPO_ROOT, "docs/architecture/collection-classification.json"),
});

export const LIFECYCLE_CLASSES = Object.freeze({
  A: "SYSTEM",
  B: "CONFIGURATION / MASTER",
  C: "CMS CANDIDATE",
  D: "BUSINESS / PROTECTED HISTORY",
  E: "DEMO / TEST",
  F: "FILE METADATA",
});

// Repository class (collection-classification.json) → lifecycle class.
const CLASS_MAP = Object.freeze({ SYSTEM: "A", CONFIGURATION: "B", CMS: "C", BUSINESS: "D", "LOG/AUDIT": "D" });

// Collections whose records ARE file metadata (records that describe stored
// objects) — lifecycle class F instead of their repository class.
const FILE_METADATA = Object.freeze(["files", "media"]);

// Records that hold credential material (hashes or token hashes).
const CONTAINS_CREDENTIALS = Object.freeze(["users", "invites"]);

// Records that reference stored objects (public media, private files, CVs,
// attachments, receipts). Declared metadata only; nothing is enumerated.
const STORAGE_REFERENCES = Object.freeze({
  media: "public",
  files: "mixed (private store and legacy public metadata)",
  jobapplications: "private",
  servicetemplates: "private",
  hrexpenses: "external-url",
  invoices: "mixed",
  quotations: "mixed",
  rfqs: "mixed",
  brandassets: "public",
  customers: "public",
  users: "public",
  jobs: "public",
  productions: "public",
  portfolios: "public",
  workitems: "public",
  heroslides: "public",
  digitalservices: "public",
  solutions: "public",
  sitesettings: "public",
  procurementcategories: "public",
});

// Class E is row-level: the repository has no test-only collection, so no
// collection is assigned to it. Demo/test rows live inside D collections.

function loadJson(file, label) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    throw new LifecycleError("CATALOG_UNAVAILABLE", `the ${label} could not be read`, EXIT.VALIDATION_FAILURE);
  }
}

/** Build the catalog from parsed inventory + classification documents. */
export function buildCatalog({ inventory, classification }) {
  const bad = (msg) => {
    throw new LifecycleError("CATALOG_INVALID", msg, EXIT.VALIDATION_FAILURE);
  };
  if (!isPlainObject(inventory) || !Array.isArray(inventory.models)) bad("source inventory has no models");
  if (!isPlainObject(classification)) bad("collection classification is not an object");

  const models = inventory.models.map((m) => ({ model: m.name, collection: m.collection, indexes: (m.indexes || []).length }));
  if (models.some((m) => typeof m.model !== "string" || typeof m.collection !== "string" || !m.collection)) bad("source inventory has a model without a collection");
  if (duplicates(models.map((m) => m.collection)).length) bad("two models share a collection");
  const names = models.map((m) => m.model).sort();
  const classified = Object.keys(classification).sort();
  if (JSON.stringify(names) !== JSON.stringify(classified)) bad("collection classification does not cover exactly the inventory's models");

  const known = new Set(models.map((m) => m.collection));
  for (const list of [FILE_METADATA, CONTAINS_CREDENTIALS, Object.keys(STORAGE_REFERENCES)]) {
    const stale = list.filter((c) => !known.has(c));
    if (stale.length) bad("lifecycle metadata names a collection the inventory does not have");
  }

  const entries = models
    .map(({ model, collection, indexes }) => {
      const sourceClass = classification[model];
      if (!Object.hasOwn(CLASS_MAP, sourceClass)) bad("collection classification uses an unknown class");
      const lifecycleClass = FILE_METADATA.includes(collection) ? "F" : CLASS_MAP[sourceClass];
      const businessHistory = sourceClass === "BUSINESS" || sourceClass === "LOG/AUDIT";
      return {
        collection,
        model,
        sourceClass,
        lifecycleClass,
        lifecycleClassName: LIFECYCLE_CLASSES[lifecycleClass],
        declaredIndexes: indexes,
        storage: STORAGE_REFERENCES[collection] ?? null,
        protection: {
          protected: true,
          resetEligible: false, // no reset policy exists in R5-D1
          requiresOwnerDecision: businessHistory || lifecycleClass === "F",
          containsCredentials: CONTAINS_CREDENTIALS.includes(collection),
          containsBusinessHistory: businessHistory,
          containsFileReferences: Object.hasOwn(STORAGE_REFERENCES, collection),
          writable: false, // R5-D1 provides no write operation for any collection
        },
      };
    })
    .sort((a, b) => a.collection.localeCompare(b.collection));

  const body = { schemaVersion: CATALOG_SCHEMA_VERSION, entries };
  return { ...body, catalogVersion: digestOf(body), byCollection: new Map(entries.map((e) => [e.collection, e])) };
}

/** Load the catalog from the repository's existing documents. */
export function loadCatalog(sources = DEFAULT_SOURCES) {
  return buildCatalog({
    inventory: loadJson(sources.inventory, "source inventory"),
    classification: loadJson(sources.classification, "collection classification"),
  });
}

/** Protection for a collection the repository does not know. */
export function unknownCollectionEntry(name) {
  return {
    collection: name,
    model: null,
    sourceClass: null,
    lifecycleClass: null,
    lifecycleClassName: "UNCLASSIFIED",
    declaredIndexes: null,
    storage: null,
    protection: {
      protected: true,
      resetEligible: false,
      requiresOwnerDecision: true,
      containsCredentials: null,
      containsBusinessHistory: null,
      containsFileReferences: null,
      writable: false,
    },
  };
}
