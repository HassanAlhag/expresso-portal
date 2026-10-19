// Group labels and membership come from the existing Solutions API, not React.
// Keep CMS ordering within each group and retain uncategorized legacy content.
export function groupTechnologySolutions(solutions = [], groups = []) {
  const grouped = groups.map((group) => ({ ...group, items: [] }));
  const byId = new Map(grouped.map((group) => [group.id, group]));
  const unassigned = [];
  for (const solution of solutions) {
    if (solution.isActive === false) continue;
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
