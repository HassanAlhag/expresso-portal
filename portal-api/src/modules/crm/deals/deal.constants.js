export const DEAL_STAGES = [
  "discovery",
  "qualified",
  "proposal",
  "negotiation",
  "verbal_commitment",
  "won",
  "lost",
];

export const DEAL_PIPELINES = ["sales"];

export function normalizeDealStage(value) {
  const v = String(value || "discovery")
    .trim()
    .toLowerCase();
  return DEAL_STAGES.includes(v) ? v : "discovery";
}

export function safeDealSort(sort) {
  const raw = String(sort || "-createdAt");
  const allowed = new Set([
    "createdAt",
    "-createdAt",
    "updatedAt",
    "-updatedAt",
    "title",
    "-title",
    "value",
    "-value",
    "expectedCloseDate",
    "-expectedCloseDate",
    "stage",
    "-stage",
  ]);

  if (!allowed.has(raw)) return { createdAt: -1 };

  const key = raw.startsWith("-") ? raw.slice(1) : raw;
  const dir = raw.startsWith("-") ? -1 : 1;
  return { [key]: dir };
}
