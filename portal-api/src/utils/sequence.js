// Unique, per-year document numbers (remediation P2-3).
//
// nextNumber() takes the next value from an atomic counter document
// ({ _id: "<key>-<year>", seq }) using MongoDB's single-document atomicity, so
// it stays correct with several Node processes. Nothing is cached in memory.
//
// Bootstrap of a counter that does not exist yet:
//   1. $inc on the counter                  → null (no document yet)
//   2. read the highest number stored for that year's prefix
//   3. INSERT { _id, seq: highest }         → only one process can succeed,
//      because _id is unique; the others get E11000 and ignore it. A loser's
//      (possibly older) highest value is therefore never written.
//   4. $inc again                           → every caller, winner or loser,
//      gets a distinct value above the stored highest.
// No counter value is ever lowered: later corrections use $max.
import Counter from "../modules/admin/counter.model.js";

function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Highest numeric suffix stored in Model[field] for values like `${prefix}0042`. */
export async function highestInUse(Model, field, prefix) {
  const pattern = `^${escapeRegex(prefix)}\\d+$`;
  const rows = await Model.find({ [field]: { $regex: pattern } }).select(field).lean();
  let max = 0;
  for (const row of rows || []) {
    const n = parseInt(String(row?.[field] || "").slice(prefix.length), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max;
}

async function increment(key) {
  return Counter.findOneAndUpdate({ _id: key }, { $inc: { seq: 1 } }, { new: true }).lean();
}

/**
 * Raise an existing counter so its next value is above `value`; never lowers
 * it and never creates it (a counter created later starts above the highest
 * stored number anyway, which includes `value`).
 */
export async function raiseCounter(key, value) {
  if (!Number.isFinite(value) || value <= 0) return;
  await Counter.updateOne({ _id: key }, { $max: { seq: value } });
}

/** For a value like INV-2027-0050 returns { counterKey: "invoice-2027", seq: 50 }; null if not in the standard format. */
export function parseNumber(value, { label, key }) {
  const m = new RegExp(`^${escapeRegex(label)}-(\\d{4})-(\\d+)$`).exec(String(value || "").trim());
  return m ? { counterKey: `${key}-${m[1]}`, seq: parseInt(m[2], 10) } : null;
}

/**
 * Next number for `${label}-${year}-NNNN` stored in Model[field].
 * Format is unchanged from the previous generators (4-digit minimum padding).
 */
export async function nextNumber({ Model, field, label, key, year = new Date().getFullYear() }) {
  const prefix = `${label}-${year}-`;
  const counterKey = `${key}-${year}`;
  let doc = await increment(counterKey);
  if (!doc) {
    const floor = await highestInUse(Model, field, prefix);
    try {
      await Counter.create({ _id: counterKey, seq: floor });
    } catch (e) {
      if (e?.code !== 11000) throw e; // another request created it first
    }
    doc = await increment(counterKey);
    if (!doc) throw new Error(`Sequence ${counterKey} could not be initialised`);
  }
  return { value: `${prefix}${String(doc.seq).padStart(4, "0")}`, prefix, counterKey };
}

export function isDuplicateKey(err, field) {
  if (err?.code !== 11000) return false;
  if (!field) return true;
  return Boolean(err.keyPattern?.[field] || err.keyValue?.[field] !== undefined || String(err.message || "").includes(field));
}
