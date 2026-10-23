import { listStaff } from "../api";

// Every staff record matching `params`, page by page (the API caps a page at
// 100). Stops after `maxPages` and reports whether the set is complete.
export async function loadAllStaff(params = {}, maxPages = 10) {
  const items = [];
  let total = 0;
  for (let page = 1; page <= maxPages; page += 1) {
    const res = await listStaff({ ...params, page, limit: 100 });
    const batch = Array.isArray(res?.items) ? res.items : [];
    items.push(...batch);
    total = Number(res?.total ?? items.length);
    if (items.length >= total || !batch.length) break;
  }
  return { items, total, complete: items.length >= total };
}
