// Prefer CMS/API taxonomy and assignments. The approved defaults support older
// responses and group-less legacy records without inventing cards or DB writes.
import { isTechnologySolution } from "./solutionKinds";
import fallbackGroups from "../data/technologyGroupsFallback.json";

const legacyGroupBySlug = new Map(fallbackGroups.flatMap(({ id, legacySlugs }) =>
  legacySlugs.map((slug) => [slug, id])
));
const defaultGroups = fallbackGroups.map(({ legacySlugs, ...group }) => group);

export function groupTechnologySolutions(solutions = [], groups = []) {
  const taxonomy = groups?.length ? groups : defaultGroups;
  const grouped = taxonomy.map((group) => ({ ...group, items: [] }));
  const byId = new Map(grouped.map((group) => [group.id, group]));
  const unassigned = [];
  for (const solution of solutions) {
    if (solution.isActive === false) continue;
    // Digital Solutions (e.g. CAS) never appear under Technology Solutions.
    if (!isTechnologySolution(solution)) continue;
    const group = byId.get(solution.group || legacyGroupBySlug.get(solution.slug));
    if (group) group.items.push(solution);
    else unassigned.push(solution);
  }
  if (unassigned.length) {
    grouped.push({
      id: "other-technology",
      label: "More Technology Solutions",
      description: "Explore more technology from our supplier network.",
      items: unassigned,
    });
  }
  return grouped;
}
