import React, { StrictMode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import DigitalSolutionsPage from "./DigitalSolutionsPage";

// Browser validation covers the real router; CRA's Jest resolver predates
// React Router 7's package exports.
jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
}), { virtual: true });

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
const response = (items = []) => ({ ok: true, json: async () => ({ ok: true, items }) });

test("A: CAS is visible while loading and remains once after a genuine empty CMS result", async () => {
  let resolve;
  global.fetch = jest.fn(() => new Promise((done) => { resolve = done; }));
  render(<DigitalSolutionsPage />);
  expect(screen.getByRole("status", { name: "Loading products" })).toBeTruthy();
  expect(screen.getAllByRole("heading", { name: /^CAS/ })).toHaveLength(1);
  await act(async () => resolve(response()));
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.getAllByRole("heading", { name: /^CAS/ })).toHaveLength(1);
  expect(screen.getByRole("link", { name: "Explore CAS", exact: true }).getAttribute("href")).toBe("/digital-solutions/cas");
  expect(screen.queryByText("Our products are being updated.")).toBeNull();
  expect(screen.queryByRole("alert")).toBeNull();
});

test("B: a published CAS record overrides presentation without duplicating the core card", async () => {
  const cas = {
    slug: "cas", kind: "digital", isActive: true, title: "CAS for clinics",
    tagline: "Approved CMS tagline", heroImageUrl: "/approved-cas.webp", ctaLabel: "Discover CAS",
    demoCtaHref: "/contact-us?interest=walkthrough", demoCtaLabel: "Book a walkthrough",
  };
  global.fetch = jest.fn().mockResolvedValue(response([cas, cas]));
  render(<DigitalSolutionsPage />);
  expect(await screen.findByRole("heading", { name: /^CAS for clinics/ })).toBeTruthy();
  expect(screen.getAllByRole("article")).toHaveLength(1);
  expect(screen.getByText(cas.tagline)).toBeTruthy();
  expect(screen.getByRole("img").getAttribute("src")).toBe(cas.heroImageUrl);
  expect(screen.getByRole("link", { name: "Discover CAS", exact: true }).getAttribute("href")).toBe("/digital-solutions/cas");
  expect(screen.getByRole("link", { name: "Book a walkthrough", exact: true }).getAttribute("href")).toBe(cas.demoCtaHref);
});

test("C: future CMS products render beside CAS even without a CAS CMS record", async () => {
  global.fetch = jest.fn().mockResolvedValue(response([{ slug: "sample", title: "CMS product", kind: "digital" }]));
  render(<DigitalSolutionsPage />);
  expect(await screen.findByRole("heading", { name: "CMS product" })).toBeTruthy();
  expect(screen.getAllByRole("heading", { name: /^CAS/ })).toHaveLength(1);
  expect(screen.getAllByRole("article")).toHaveLength(2);
  expect(screen.queryByText("Our products are being updated.")).toBeNull();
});

test.each([
  ["HTTP 503", () => Promise.resolve({ ok: false, status: 503 })],
  ["network failure", () => Promise.reject(new TypeError("Network unavailable"))],
  ["invalid JSON", () => Promise.resolve({ ok: true, json: async () => { throw new SyntaxError("Invalid JSON"); } })],
  ["invalid payload", () => Promise.resolve({ ok: true, json: async () => ({ ok: true }) })],
  ["API error payload", () => Promise.resolve({ ok: true, json: async () => ({ ok: false, items: [] }) })],
])("%s shows an error alongside core CAS, and retry recovers", async (_, failure) => {
  global.fetch = jest.fn().mockImplementationOnce(failure).mockResolvedValue(response());
  render(<DigitalSolutionsPage />);
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.queryByText("Our products are being updated.")).toBeNull();
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.getAllByRole("heading", { name: /^CAS/ })).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getAllByRole("heading", { name: /^CAS/ })).toHaveLength(1);
});

test("Strict Mode cleanup and unmount ignore late success and failure", async () => {
  const requests = [];
  global.fetch = jest.fn(() => new Promise((resolve, reject) => requests.push({ resolve, reject })));
  const view = render(<StrictMode><DigitalSolutionsPage /></StrictMode>);
  expect(requests).toHaveLength(2);
  view.unmount();
  render(<StrictMode><DigitalSolutionsPage /></StrictMode>);
  expect(requests).toHaveLength(4);
  await act(async () => {
    requests[0].reject(new TypeError("Old network failure"));
    requests[1].resolve(response([{ slug: "old", title: "Stale product", kind: "digital" }]));
    requests[2].reject(new TypeError("Strict Mode cleanup"));
    requests[3].resolve(response());
  });
  expect(screen.getAllByRole("heading", { name: /^CAS/ })).toHaveLength(1);
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.queryByText("Stale product")).toBeNull();
});
