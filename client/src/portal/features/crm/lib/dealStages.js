// Deals per stage (PUI-3). `total` is the real global count from the list
// endpoint; a stage's value is only summed when all of its deals are in the
// response (the API returns at most 100 per request).
import { listDeals } from "../api";
import { DEAL_STAGES, OPEN_DEAL_STAGES } from "../format";

const STAGE_PAGE = 100; // the API's maximum page size

export async function loadStageColumns(extra = {}) {
  const results = await Promise.all(
    DEAL_STAGES.map(async (stage) => {
      const r = await listDeals({ ...extra, stage, sort: "-value", page: 1, limit: STAGE_PAGE });
      const items = Array.isArray(r?.items) ? r.items : [];
      return [stage, { items, total: Number(r?.total || 0) }];
    })
  );
  return Object.fromEntries(results);
}

export function summarizeStages(columns) {
  const sum = (stages) => stages.reduce((s, st) => s + (columns[st]?.total || 0), 0);
  const complete = (stages) => stages.every((st) => (columns[st]?.total || 0) <= (columns[st]?.items?.length || 0));
  const value = (stages) => stages.reduce((s, st) => s + (columns[st]?.items || []).reduce((v, d) => v + Number(d.value || 0), 0), 0);
  return {
    open: sum(OPEN_DEAL_STAGES),
    late: sum(["negotiation", "verbal_commitment"]),
    won: sum(["won"]),
    lost: sum(["lost"]),
    openValue: complete(OPEN_DEAL_STAGES) ? value(OPEN_DEAL_STAGES) : null,
    wonValue: complete(["won"]) ? value(["won"]) : null,
  };
}

