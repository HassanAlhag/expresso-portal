// MongoDB transactions for multi-document business operations (R4-C, P2-2).
//
// Transactions need a replica set or a sharded cluster. There is deliberately
// no non-transactional fallback: if the connected deployment cannot run a
// transaction, the operation is refused before it writes anything.
//
// The work function may be run more than once (the driver retries transient
// transaction errors), so it must only read and write MongoDB through the
// session it receives: no HTTP responses, email or other side effects.
import mongoose from "mongoose";

export class TransactionUnsupportedError extends Error {
  constructor() {
    super("The connected MongoDB deployment does not support transactions");
    this.name = "TransactionUnsupportedError";
    this.code = "TRANSACTIONS_UNSUPPORTED";
  }
}

let supported = false; // only a positive answer is cached

/**
 * True when the connected deployment can run multi-document transactions.
 * Uses the read-only `hello` command; never writes. Logs the topology (not the
 * connection string) when transactions are unavailable.
 */
export async function transactionsSupported(connection = mongoose.connection) {
  if (supported) return true;
  const db = connection?.db;
  if (!db) return false;
  const hello = await db.admin().command({ hello: 1 });
  const ok = Boolean(hello?.setName) || hello?.msg === "isdbgrid";
  if (ok) {
    supported = true;
  } else {
    console.error(
      "Transactions unavailable: the MongoDB deployment is a standalone server " +
        "(no replica set name in hello). Operations that require atomic writes are refused."
    );
  }
  return ok;
}

/** Test hook: forget a cached positive answer. */
export function resetTransactionSupportCache() {
  supported = false;
}

/**
 * Runs `work(session)` in one transaction and returns its result.
 * Throws TransactionUnsupportedError (nothing written) on a standalone server;
 * any other error means the transaction was aborted and nothing was committed.
 */
export async function runInTransaction(work, connection = mongoose.connection) {
  if (!(await transactionsSupported(connection))) throw new TransactionUnsupportedError();
  let result;
  await connection.transaction(async (session) => {
    result = await work(session);
  });
  return result;
}
