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
  expect(groupTechnologySolutions(solutions).at(-1).items).toEqual(solutions);
  expect(groupTechnologySolutions([], groups)).toHaveLength(2);
});

const legacyMembership = {
  "Business Software": ["erp-solution", "crm-solution", "queue-management", "software-licensing"],
  "Cloud & Hosting": ["cloud-services", "web-hosting-domains"],
  Infrastructure: ["data-center", "data-center-hardware", "networking-hardware"],
  "Connectivity & Advisory": ["iot-solutions", "vas-solutions", "it-consultation"],
};

test("all twelve legacy CMS records form the four approved groups without group fields or API taxonomy", () => {
  const solutions = Object.values(legacyMembership).flat().map((slug) => ({ slug, title: slug }));
  const result = groupTechnologySolutions(solutions);
  expect(result.map(({ label }) => label)).toEqual(Object.keys(legacyMembership));
  for (const group of result) {
    expect(group.items.map(({ slug }) => slug)).toEqual(legacyMembership[group.label]);
  }
});

test("API taxonomy still classifies group-less legacy records and CMS assignments/labels win", () => {
  const taxonomy = [
    { id: "business-software", label: "CMS software label" },
    { id: "cloud-hosting", label: "CMS cloud label" },
  ];
  const result = groupTechnologySolutions([
    { slug: "erp-solution", group: "" },
    { slug: "crm-solution", group: "cloud-hosting" },
    { slug: "software-licensing", group: null },
    { slug: "cas", kind: "digital", group: "business-software" },
  ], taxonomy);
  expect(result.map(({ label }) => label)).toEqual(["CMS software label", "CMS cloud label"]);
  expect(result[0].items.map(({ slug }) => slug)).toEqual(["erp-solution", "software-licensing"]);
  expect(result[1].items.map(({ slug }) => slug)).toEqual(["crm-solution"]);
});

test("fallback never invents solutions, exposes inactive content or moves digital products into Technology", () => {
  const result = groupTechnologySolutions([
    { slug: "erp-solution", kind: "digital" },
    { slug: "cas", kind: "digital" },
    { slug: "crm-solution", isActive: false },
    { slug: "custom-technology", title: "Custom" },
  ]);
  expect(result.flatMap(({ items }) => items).map(({ slug }) => slug)).toEqual(["custom-technology"]);
});
