// In-memory stand-in for the few MongoDB collections used by vendor approval
// and invitation acceptance. Each write is applied at call time, the way a
// single-document MongoDB operation is atomic, so concurrent requests through
// the real Express app interleave realistically. No database is used.
import mongoose from "mongoose";
import { stub, q } from "./helpers.js";

const isOperatorObject = (c) =>
  c && typeof c === "object" && !(c instanceof Date) && Object.keys(c).some((k) => k.startsWith("$"));
const same = (a, b) => (a == null && b == null) || (a != null && b != null && String(a) === String(b));

export function matches(doc, filter = {}) {
  for (const [key, cond] of Object.entries(filter)) {
    if (key === "$or") {
      if (!cond.some((f) => matches(doc, f))) return false;
      continue;
    }
    const v = doc[key];
    if (isOperatorObject(cond)) {
      for (const [op, arg] of Object.entries(cond)) {
        if (op === "$ne" && same(v, arg)) return false;
        if (op === "$gt" && !(v != null && v > arg)) return false;
        if (op === "$lt" && !(v != null && v < arg)) return false;
        if (op === "$in" && !arg.some((a) => same(v, a))) return false;
      }
    } else if (!same(v, cond)) return false;
  }
  return true;
}

const copy = (d) => (d ? { ...d } : null);

/**
 * Stubs the given models over arrays in `db`. `failures` maps
 * "Model.method" to a count of calls that should throw first.
 */
export function fakeCollections(db, models, { failures = {}, uniqueEmail = [] } = {}) {
  const ops = [];
  for (const [name, Model] of Object.entries(models)) {
    const coll = (db[name] = db[name] || []);
    const maybeFail = (method) => {
      const key = `${name}.${method}`;
      if (failures[key] > 0) {
        failures[key] -= 1;
        throw new Error(`simulated ${key} failure`);
      }
    };
    const apply = (d, update) => Object.assign(d, update.$set || update);
    stub(Model, "create", async (doc) => {
      maybeFail("create");
      const d = { createdAt: new Date(), ...doc, _id: doc._id || new mongoose.Types.ObjectId() };
      if (coll.some((x) => same(x._id, d._id))) throw new Error(`E11000 duplicate key ${name}._id`);
      if (uniqueEmail.includes(name) && coll.some((x) => x.email === d.email)) {
        throw new Error(`E11000 duplicate key ${name}.email`);
      }
      coll.push(d);
      ops.push([name, "create", d._id]);
      return copy(d);
    });
    stub(Model, "find", (f) => q(() => coll.filter((d) => matches(d, f)).map(copy)));
    stub(Model, "findOne", (f) => q(() => copy(coll.find((d) => matches(d, f)))));
    stub(Model, "findById", (id) => q(() => copy(coll.find((d) => same(d._id, id)))));
    stub(Model, "countDocuments", (f) => q(() => coll.filter((d) => matches(d, f)).length));
    stub(Model, "findOneAndUpdate", (f, update) => {
      maybeFail("findOneAndUpdate");
      const d = coll.find((x) => matches(x, f));
      if (d) apply(d, update);
      ops.push([name, "findOneAndUpdate", d?._id || null]);
      return q(copy(d));
    });
    stub(Model, "findByIdAndUpdate", (id, update) => {
      const d = coll.find((x) => same(x._id, id));
      if (d) apply(d, update);
      return q(copy(d));
    });
    stub(Model, "updateOne", (f, update) => {
      maybeFail("updateOne");
      const d = coll.find((x) => matches(x, f));
      if (d) apply(d, update);
      ops.push([name, "updateOne", d?._id || null]);
      return q({ matchedCount: d ? 1 : 0, modifiedCount: d ? 1 : 0 });
    });
    stub(Model, "deleteOne", (f) => {
      const i = coll.findIndex((x) => matches(x, f));
      if (i >= 0) coll.splice(i, 1);
      ops.push([name, "deleteOne", i >= 0]);
      return q({ deletedCount: i >= 0 ? 1 : 0 });
    });
  }
  return ops;
}
