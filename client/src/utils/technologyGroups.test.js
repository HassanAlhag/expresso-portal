import { groupTechnologySolutions } from "./technologyGroups";

const groups = [
  { id: "software", label: "Business Software" },
  { id: "cloud", label: "Cloud & Hosting" },
];

test("uses API taxonomy and preserves CMS item ordering without duplicating content", () => {
  const solutions = [
    { slug: "crm", group: "software" },
    { slug: "cloud-services", group: "cloud" },
    { slug: "erp", group: "software" },
  ];
  const result = groupTechnologySolutions(solutions, groups);
  expect(result.map(({ label }) => label)).toEqual(["Business Software", "Cloud & Hosting"]);
  expect(result[0].items.map(({ slug }) => slug)).toEqual(["crm", "erp"]);
  expect(result.flatMap(({ items }) => items)).toHaveLength(3);
  expect(groups[0].items).toBeUndefined();
});

test("CMS reassignment moves a solution and inactive records stay out of public groups", () => {
  const result = groupTechnologySolutions([
    { slug: "crm", group: "cloud" },
    { slug: "erp", group: "software", isActive: false },
  ], groups);
  expect(result[0].items).toEqual([]);
  expect(result[1].items.map(({ slug }) => slug)).toEqual(["crm"]);
});

test("retains unassigned and unknown legacy solutions, including with an older API", () => {
  const solutions = [{ slug: "custom" }, { slug: "future", group: "new-group" }];
  expect(groupTechnologySolutions(solutions, groups).at(-1).items).toEqual(solutions);
  expect(groupTechnologySolutions(solutions)[0].items).toEqual(solutions);
  expect(groupTechnologySolutions([], groups)).toHaveLength(2);
});
