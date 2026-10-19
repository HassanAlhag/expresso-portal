import { buildMenus } from "./navData";

test("technology navigation uses the API groups and existing detail URLs", () => {
  const menu = buildMenus({
    solutions: [{ title: "ERP Solution", slug: "erp-solution", group: "business-software" }],
    solutionGroups: [{ id: "business-software", label: "Business Software" }],
  }).find(({ key }) => key === "technology");
  expect(menu.groups[0].label).toBe("Business Software");
  expect(menu.groups[0].items[0].to).toBe("/it-solutions/erp-solution");
  expect(menu.action.primary.to).toBe("/vendor-registration");
  expect(menu.action.secondary.to).toBe("/portal/login");
});

test("Work With Us keeps the approved client, vendor and talent journeys", () => {
  const menu = buildMenus().find(({ key }) => key === "work-with-us");
  expect(menu.groups.map(({ label }) => label)).toEqual(["As a client", "As a vendor", "As talent"]);
  expect(menu.groups.map(({ items }) => items.map(({ to }) => to))).toEqual([
    ["/build-your-plan", "/contact-us"],
    ["/vendor-registration"],
    ["/careers"],
  ]);
});
