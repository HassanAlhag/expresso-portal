import React, { StrictMode } from "react";
import { act, render, screen } from "@testing-library/react";
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
  await act(async () => requests[2].resolve({ json: async () => ({ ok: true, item: { slug: "crm-solution", subtitle: "Current CRM" } }) }));
  expect(screen.getByRole("heading", { name: "Current CRM" })).toBeTruthy();
  await act(async () => {
    requests[0].resolve({ json: async () => ({ ok: true, item: { slug: "erp-solution", subtitle: "Stale ERP" } }) });
    requests[1].reject(new TypeError("Old network failure"));
  });
  expect(screen.getByRole("heading", { name: "Current CRM" })).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Stale ERP" })).toBeNull();
  expect(screen.queryByRole("heading", { name: "Solution Not Found" })).toBeNull();
});
