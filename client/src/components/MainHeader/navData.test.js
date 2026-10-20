import { buildMenus, isMenuActive } from "./navData";

const digitalMenu = (cms) => buildMenus(cms).find((m) => m.key === "digital-solutions");
const techMenu = (cms) => buildMenus(cms).find((m) => m.key === "technology");

const CAS = {
  _id: "1",
  slug: "cas",
  kind: "digital",
  title: "CAS",
  subtitle: "Clinic Appointment System",
  tagline: "A clinic appointment platform designed and developed by Expresso Digital.",
  badge: "Built by Expresso",
  ctaLabel: "Explore CAS",
  demoCtaLabel: "Request a Demo",
  demoCtaHref: "/contact-us?interest=cas-demo",
};

test("Digital Solutions heading opens the landing page, not CAS", () => {
  expect(digitalMenu({}).href).toBe("/digital-solutions");
});

test("Digital Solutions products come from CMS records with their own URLs", () => {
  const menu = digitalMenu({ digital: [CAS], digitalLoaded: true });
  expect(menu.featured).toHaveLength(1);
  expect(menu.featured[0]).toMatchObject({
    to: "/digital-solutions/cas",
    badge: "Built by Expresso",
    title: "CAS — Clinic Appointment System",
  });
  expect(menu.action.primary.to).toBe("/contact-us?interest=cas-demo");
});

test("a second product needs no code change", () => {
  const next = { ...CAS, _id: "2", slug: "next-product", title: "Next", subtitle: "", badge: "" };
  const menu = digitalMenu({ digital: [CAS, next], digitalLoaded: true });
  expect(menu.featured.map((f) => f.to)).toEqual(["/digital-solutions/cas", "/digital-solutions/next-product"]);
  expect(menu.featured[1].badge).toBe("Built by Expresso");
});

test("while loading the menu waits; once loaded and empty it still links somewhere", () => {
  expect(digitalMenu({ digital: [], digitalLoaded: false }).groups).toEqual([]);
  const empty = digitalMenu({ digital: [], digitalLoaded: true });
  expect(empty.groups[0].items[0].to).toBe("/digital-solutions");
});

test("Technology Solutions menu does not list digital products", () => {
  const menu = techMenu({ solutions: [{ slug: "erp-solution", title: "ERP" }], digital: [CAS], digitalLoaded: true });
  const links = menu.groups.flatMap((g) => g.items.map((i) => i.to));
  expect(links).toEqual(["/it-solutions/erp-solution"]);
});

test("old CAS URL highlights Digital Solutions", () => {
  const menu = digitalMenu({});
  expect(isMenuActive(menu, "/products/cas")).toBe(true);
  expect(isMenuActive(menu, "/digital-solutions/cas")).toBe(true);
  expect(isMenuActive(techMenu({}), "/digital-solutions/cas")).toBe(false);
});
