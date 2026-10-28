// R5-D2 — read-only live MongoDB access for backup identity and inventory.
//
// The ONLY lifecycle module that talks to MongoDB. It exposes a frozen set of
// read functions: hello, buildInfo, dbHash, listCollections, countDocuments,
// listIndexes, serverInfo and close. There is no write, drop, index, user or
// admin operation, and no generic command or query interface. The driver is
// the one bundled with mongoose (an existing dependency); no application
// model, connection module, .env or environment value is used.
//
// Connections are direct to the single declared host (no discovery of other
// advertised members) and read from the primary. Least privilege: a user
// with the built-in `read` role on the target database is sufficient here
// (hello, buildInfo, listCollections, listIndexes, count, dbHash).

import mongoose from "mongoose";

const { MongoClient } = mongoose.mongo;
const READ_COMMANDS = new Set(["hello", "buildInfo", "dbHash"]);

/** Remove the replicaSet option from a connection string's query. */
export function withoutReplicaSet(uri) {
  const q = uri.indexOf("?");
  if (q === -1) return uri;
  const kept = uri.slice(q + 1).split("&").filter((p) => p && !/^replicaset=/i.test(p));
  return kept.length ? `${uri.slice(0, q)}?${kept.join("&")}` : uri.slice(0, q);
}

/**
 * Open a read-only handle on `database` at `uri`. The caller has already
 * resolved the URI against a D1 profile; this never logs or returns it.
 */
export async function openReadOnlyTarget(uri, database, { timeoutMs = 8000, singleHost = true } = {}) {
  // A single declared host is reached directly, without the URI's replicaSet
  // filter, so the caller can read the server's own hello and compare its
  // replica-set name with the profile itself (rather than the driver hiding
  // a mismatch as an unreachable server).
  const target = singleHost ? withoutReplicaSet(uri) : uri;
  const client = new MongoClient(target, {
    appName: "expresso-lifecycle-backup",
    serverSelectionTimeoutMS: timeoutMs,
    connectTimeoutMS: timeoutMs,
    readPreference: "primary",
    retryWrites: false,
    maxPoolSize: 2,
    ...(singleHost ? { directConnection: true } : {}),
  });
  await client.connect();
  const db = client.db(database);
  const command = (name) => {
    if (!READ_COMMANDS.has(name)) throw new Error("command not allowed");
    return db.command({ [name]: 1 });
  };
  const listCollections = async () =>
    (await db.listCollections({}, { nameOnly: false }).toArray())
      .map((c) => ({ name: c.name, type: c.type || "collection", options: c.options || {} }))
      .sort((a, b) => a.name.localeCompare(b.name));
  return Object.freeze({
    hello: () => command("hello"),
    buildInfo: () => command("buildInfo"),
    dbHash: () => command("dbHash"),
    listCollections,
    countDocuments: (name) => db.collection(name).countDocuments({}),
    listIndexes: async (name) => db.collection(name).listIndexes().toArray(),
    serverInfo: async () => {
      const [h, b] = [await command("hello"), await command("buildInfo")];
      return { version: String(b.version), topology: h.msg === "isdbgrid" ? "sharded" : h.setName ? "replica-set" : "standalone" };
    },
    close: () => client.close(),
  });
}
