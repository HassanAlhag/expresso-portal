import { idOf } from "../format";

const norm = (s) => String(s || "").trim().toLowerCase();
const LIMIT = 100; // the HR list APIs' page maximum

/** True when a leave or expense record belongs to this staff record. */
export function belongsToStaff(record, staff) {
  const uid = idOf(staff?.linkedUserId);
  if (uid && String(idOf(record?.staffUserId)) === String(uid)) return true;
  return Boolean(norm(staff?.fullName)) && norm(record?.staffName) === norm(staff.fullName);
}

// Leave and expense records carry a staff name and, sometimes, a portal user
// rather than a staff-record link, and their list APIs have no staff filter.
// So: search by the person's name, then keep only exact name or linked-user
// matches. `complete` is false when the search returned more than one page.
export async function loadStaffRecords(listFn, staff) {
  const res = await listFn({ q: staff.fullName, sort: "-createdAt", page: 1, limit: LIMIT });
  const items = Array.isArray(res?.items) ? res.items : [];
  return { items: items.filter((r) => belongsToStaff(r, staff)), complete: Number(res?.total ?? items.length) <= items.length };
}
