// Conversion wording (PUI-3, updated R4-C). Describes what the endpoints do.
// Each conversion runs in a single database transaction (P2-2): it is saved in
// full or not at all, and repeating it returns the record already linked.

export const LEAD_CONVERSION_DETAILS = [
  "Creates a deal at the Discovery stage, linked to this lead.",
  "Finds or creates a CRM account and contact from the lead's company and email.",
  "Marks the lead as converted. A lead can be converted only once.",
];

export const DEAL_CONVERSION_DETAILS = [
  "Links the deal to a client account: an existing client with the same email or company name is reused, otherwise a new client is created.",
  "Creates a CRM account if the deal has none, and a primary contact if the client has none.",
  "Keeps the deal at Won and records the client on it. A deal can be converted only once.",
];

/** Turns a conversion failure into a message that tells the user what to do. */
export function conversionError(e, kind) {
  const status = e?.response?.status;
  const msg = e?.response?.data?.message;
  if (!e?.response) return `The server didn't respond. Refresh to see whether this ${kind} was converted; trying again is safe.`;
  if (status === 409) return msg || `This ${kind} has already been converted. Refresh to see the linked record.`;
  if (status === 403) return "You don't have permission to convert CRM records.";
  return msg || "The conversion didn't complete. Nothing was saved.";
}
