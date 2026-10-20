import React, { StrictMode } from "react";
import { act, render, screen } from "@testing-library/react";
import ITSolutionsPage from "./ITSolutionsPage";

jest.mock("../../hooks/useSiteSettings", () => ({ useSiteSettings: () => ({}) }));
jest.mock("../../components/BannerSection/bannerSection", () => () => null);
jest.mock("../../components/HomeSection/HomeSection", () => ({ children }) => <div>{children}</div>);
jest.mock("../../components/SolutionCard/SolutionCard", () => ({ title }) => <h3>{title}</h3>);
jest.mock("../../components/WhyExpressoGrid/WhyExpressoGrid", () => () => null);
jest.mock("../../components/ProcurementProcess/ProcurementProcess", () => () => null);
jest.mock("../../components/TechnologyCTA/TechnologyCTA", () => () => null);
jest.mock("../../components/TechnologyVendorPanel/TechnologyVendorPanel", () => () => null);

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

const response = (title) => ({
  ok: true,
  json: async () => ({ items: [{ title, slug: title, kind: "technology", group: "software" }], groups: [{ id: "software", label: "Business Software" }] }),
});
const originalFetch = global.fetch;
let requests;
let abort;
beforeEach(() => {
  requests = [];
  global.fetch = jest.fn(() => {
    const request = deferred();
    requests.push(request);
    return request.promise;
  });
  abort = jest.spyOn(AbortController.prototype, "abort");
});
afterEach(() => { global.fetch = originalFetch; abort.mockRestore(); });

test("Strict Mode setup/cleanup/setup keeps the current result and ignores stale success", async () => {
  const view = render(<StrictMode><ITSolutionsPage /></StrictMode>);
  expect(requests).toHaveLength(2);
  await act(async () => requests[1].resolve(response("Current ERP")));
  expect(screen.getByRole("heading", { name: "Current ERP" })).toBeTruthy();
  await act(async () => requests[0].resolve(response("Stale ERP")));
  expect(screen.queryByRole("heading", { name: "Stale ERP" })).toBeNull();
  expect(screen.getByRole("heading", { name: "Current ERP" })).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
  view.unmount();
  expect(abort).not.toHaveBeenCalled();
});

test("unmount/remount ignores late failures and successes from abandoned effects", async () => {
  const { unmount } = render(<StrictMode><ITSolutionsPage /></StrictMode>);
  unmount();
  render(<StrictMode><ITSolutionsPage /></StrictMode>);
  expect(requests).toHaveLength(4);
  await act(async () => {
    requests[0].reject(new Error("Old network failure"));
    requests[1].resolve(response("Unmounted ERP"));
    requests[2].reject(new Error("Strict Mode replay failure"));
  });
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.queryByRole("heading", { name: "Unmounted ERP" })).toBeNull();
  expect(screen.getByRole("status")).toBeTruthy();
  await act(async () => requests[3].resolve(response("Remounted ERP")));
  expect(screen.getByRole("heading", { name: "Remounted ERP" })).toBeTruthy();
  expect(screen.queryByRole("status")).toBeNull();
  expect(abort).not.toHaveBeenCalled();
});

test.each([
  ["network failure", () => Promise.reject(new TypeError("Failed to fetch"))],
  ["HTTP failure", () => Promise.resolve({ ok: false, status: 503 })],
  ["invalid JSON", () => Promise.resolve({ ok: true, json: async () => { throw new SyntaxError("Invalid JSON"); } })],
  ["invalid payload", () => Promise.resolve({ ok: true, json: async () => ({ ok: false }) })],
  ["unexpected abort from an active request", () => Promise.reject(new DOMException("Transport aborted", "AbortError"))],
])("shows an active %s instead of swallowing it", async (_, result) => {
  global.fetch.mockImplementation(result);
  render(<StrictMode><ITSolutionsPage /></StrictMode>);
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.queryByRole("status")).toBeNull();
});
