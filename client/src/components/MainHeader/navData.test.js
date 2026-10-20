import React, { StrictMode } from "react";
import { act, renderHook } from "@testing-library/react";
import { buildMenus, isMenuActive, useCmsNavData } from "./navData";

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

// ---- Stage 3: technology groups and vendor journey ----
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

test("legacy technology navigation has the four approved groups even when API metadata is missing", () => {
  const slugs = ["erp-solution", "crm-solution", "queue-management", "software-licensing", "cloud-services", "web-hosting-domains", "data-center", "data-center-hardware", "networking-hardware", "iot-solutions", "vas-solutions", "it-consultation"];
  const menu = techMenu({ solutions: [...slugs.map((slug) => ({ slug, title: slug })), CAS] });
  expect(menu.groups.map(({ label }) => label)).toEqual(["Business Software", "Cloud & Hosting", "Infrastructure", "Connectivity & Advisory"]);
  expect(menu.groups.map(({ items }) => items.length)).toEqual([4, 2, 3, 3]);
  expect(menu.groups.flatMap(({ items }) => items.map(({ to }) => to))).not.toContain("/it-solutions/cas");
  expect(menu.action.primary.to).toBe("/vendor-registration");
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

test("Strict Mode navigation consumers share requests without cleanup canceling another consumer", async () => {
  const originalFetch = global.fetch;
  const pending = new Map();
  global.fetch = jest.fn((url) => new Promise((resolve) => pending.set(url, resolve)));
  const wrapper = ({ children }) => <StrictMode>{children}</StrictMode>;
  const { unmount: unmountFirst } = renderHook(useCmsNavData, { wrapper });
  const { result, unmount: unmountSecond } = renderHook(useCmsNavData, { wrapper });
  try {
    // Services, Technology and Digital each have one shared in-flight read.
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch.mock.calls.every(([, options]) => !options?.signal)).toBe(true);
    unmountFirst();
    await act(async () => {
      for (const [url, resolve] of pending) {
        const items = url.includes("kind=digital") ? [CAS] : [{ title: "Shared ERP", slug: "erp-solution" }];
        resolve(url.endsWith("/solutions")
          ? { ok: false, status: 503 }
          : { ok: true, json: async () => ({ items, groups: [] }) });
      }
    });
    expect(result.current.solutions).toEqual([]);
    // A startup/API failure must not become a permanent empty menu cache.
    act(() => { window.dispatchEvent(new Event("focus")); });
    expect(global.fetch).toHaveBeenCalledTimes(4);
    await act(async () => {
      const resolve = [...pending].find(([url]) => url.endsWith("/solutions"))[1];
      resolve({ ok: true, json: async () => ({ items: [{ title: "Shared ERP", slug: "erp-solution" }] }) });
    });
    expect(result.current.solutions[0].title).toBe("Shared ERP");
    expect(result.current.digital).toEqual([CAS]);
    expect(result.current.digitalLoaded).toBe(true);
  } finally {
    unmountFirst();
    unmountSecond();
    global.fetch = originalFetch;
  }
});
