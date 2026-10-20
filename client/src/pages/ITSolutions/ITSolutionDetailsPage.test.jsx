import React, { StrictMode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useParams } from "react-router-dom";
import ITSolutionDetailsPage from "./ITSolutionDetailsPage";

// CRA's Jest resolver predates React Router 7's package exports. Mock the route
// boundary; browser checks exercise the actual router and rapid navigation.
jest.mock("react-router-dom", () => ({
  useParams: jest.fn(),
  useNavigate: () => jest.fn(),
  Navigate: () => null,
}), { virtual: true });

jest.mock("../../components/BannerSection/bannerSection", () => ({ subtitle }) => <h1>{subtitle}</h1>);
jest.mock("../../components/SolutionDetailRenderer/SolutionDetailRenderer", () => () => null);
jest.mock("../../components/SolutionDetailCTA/SolutionDetailCTA", () => () => null);
jest.mock("../DigitalSolutions/customPages", () => ({ CUSTOM_SOLUTION_PAGES: {} }));

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

test("a slug change ignores success and failure from the cleaned-up Strict Mode effects", async () => {
  const requests = [];
  global.fetch = jest.fn(() => new Promise((resolve, reject) => requests.push({ resolve, reject })));
  useParams.mockReturnValue({ slug: "erp-solution" });
  const view = render(<StrictMode><ITSolutionDetailsPage /></StrictMode>);
  expect(requests).toHaveLength(2);
  useParams.mockReturnValue({ slug: "crm-solution" });
  view.rerender(<StrictMode><ITSolutionDetailsPage /></StrictMode>);
  expect(requests).toHaveLength(3);
  await act(async () => requests[2].resolve({ ok: true, json: async () => ({ ok: true, item: { slug: "crm-solution", subtitle: "Current CRM" } }) }));
  expect(screen.getByRole("heading", { name: "Current CRM" })).toBeTruthy();
  await act(async () => {
    requests[0].resolve({ ok: true, json: async () => ({ ok: true, item: { slug: "erp-solution", subtitle: "Stale ERP" } }) });
    requests[1].reject(new TypeError("Old network failure"));
  });
  expect(screen.getByRole("heading", { name: "Current CRM" })).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Stale ERP" })).toBeNull();
  expect(screen.queryByRole("heading", { name: "Solution Not Found" })).toBeNull();
});

test.each(["technology", "digital"])("only HTTP 404 is not found in the %s section", async (section) => {
  useParams.mockReturnValue({ slug: "missing" });
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
  render(<ITSolutionDetailsPage section={section} />);
  expect(await screen.findByRole("heading", { name: "Solution Not Found" })).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
});

test.each([
  ["HTTP 500", () => Promise.resolve({ ok: false, status: 500 })],
  ["network failure", () => Promise.reject(new TypeError("Network unavailable"))],
  ["invalid JSON", () => Promise.resolve({ ok: true, json: async () => { throw new SyntaxError("Invalid JSON"); } })],
  ["invalid payload", () => Promise.resolve({ ok: true, json: async () => ({ ok: false }) })],
  ["null payload", () => Promise.resolve({ ok: true, json: async () => null })],
])("%s is unavailable, not a missing solution, and can be retried", async (_, response) => {
  useParams.mockReturnValue({ slug: "erp-solution" });
  global.fetch = jest.fn().mockImplementationOnce(response).mockResolvedValue({
    ok: true, json: async () => ({ ok: true, item: { slug: "erp-solution", subtitle: "ERP restored" } }),
  });
  render(<ITSolutionDetailsPage />);
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Solution Unavailable" })).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Solution Not Found" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByRole("heading", { name: "ERP restored" })).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
});
