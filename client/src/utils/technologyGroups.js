// Group labels and membership come from the existing Solutions API, not React.
// Keep CMS ordering within each group and retain uncategorized legacy content.
import { isTechnologySolution } from "./solutionKinds";

export function groupTechnologySolutions(solutions = [], groups = []) {
  const grouped = groups.map((group) => ({ ...group, items: [] }));
  const byId = new Map(grouped.map((group) => [group.id, group]));
  const unassigned = [];
  for (const solution of solutions) {
    if (solution.isActive === false) continue;
    // Digital Solutions (e.g. CAS) never appear under Technology Solutions.
    if (!isTechnologySolution(solution)) continue;
    const group = byId.get(solution.group);
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
