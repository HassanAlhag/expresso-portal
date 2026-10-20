import React, { StrictMode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import DigitalSolutionsPage from "./DigitalSolutionsPage";

// Browser validation covers the real router; CRA's Jest resolver predates
// React Router 7's package exports.
jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
}), { virtual: true });

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
const response = (items = []) => ({ ok: true, json: async () => ({ ok: true, items }) });

test("loading, genuine empty result and populated CMS result are distinct", async () => {
  let resolve;
  global.fetch = jest.fn(() => new Promise((done) => { resolve = done; }));
  const view = render(<DigitalSolutionsPage />);
  expect(screen.getByRole("status", { name: "Loading products" })).toBeTruthy();
  await act(async () => resolve(response()));
  expect(screen.getByText("Our products are being updated.")).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
  view.unmount();
  global.fetch = jest.fn().mockResolvedValue(response([{ slug: "sample", title: "CMS product", kind: "digital" }]));
  render(<DigitalSolutionsPage />);
  expect(await screen.findByRole("heading", { name: "CMS product" })).toBeTruthy();
  expect(screen.queryByText("Our products are being updated.")).toBeNull();
});

test.each([
  ["HTTP 503", () => Promise.resolve({ ok: false, status: 503 })],
  ["network failure", () => Promise.reject(new TypeError("Network unavailable"))],
  ["invalid JSON", () => Promise.resolve({ ok: true, json: async () => { throw new SyntaxError("Invalid JSON"); } })],
  ["invalid payload", () => Promise.resolve({ ok: true, json: async () => ({ ok: true }) })],
  ["API error payload", () => Promise.resolve({ ok: true, json: async () => ({ ok: false, items: [] }) })],
])("%s is an error, not empty CMS content, and retry recovers", async (_, failure) => {
  global.fetch = jest.fn().mockImplementationOnce(failure).mockResolvedValue(response());
  render(<DigitalSolutionsPage />);
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.queryByText("Our products are being updated.")).toBeNull();
  expect(screen.queryByRole("status")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("Our products are being updated.")).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
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
  expect(screen.getByText("Our products are being updated.")).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.queryByText("Stale product")).toBeNull();
});
