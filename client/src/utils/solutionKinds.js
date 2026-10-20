// One Solutions collection feeds two website sections:
//   digital    -> Digital Solutions (software built and owned by Expresso)
//   technology -> Technology Solutions (sourced & delivered; legacy records
//                 without a kind are technology)
// The API already filters by kind; these guards keep each section correct
// even if a response ever mixes the two.
export const isDigitalSolution = (s) => s?.kind === "digital";
export const isTechnologySolution = (s) => Boolean(s) && s.kind !== "digital";

export const onlyDigital = (items = []) => items.filter(isDigitalSolution);
export const onlyTechnology = (items = []) => items.filter(isTechnologySolution);
