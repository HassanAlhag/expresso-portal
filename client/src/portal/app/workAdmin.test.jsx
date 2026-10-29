// Case Studies / Portfolio separation in the portal: the existing module is
// labelled Case Studies (portfolio.* keys unchanged), the new Portfolio module
// manages work items with its own work.* permissions.
import React from "react";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { signIn, renderPage, fillApi, setupDom, CUSTOM_INTERNAL } from "./piClosure.test.helpers";
import { isAllowed } from "./ProtectedRoute";
import { getNavSectionsByRole } from "./portalNav";
import WorkItemsPage from "../features/portfolio/pages/WorkItemsPage";
import WorkItemDetailsPage from "../features/portfolio/pages/WorkItemDetailsPage";
import PortfolioPage from "../features/portfolio/pages/PortfolioPage";

const mockNavigate = jest.fn();
jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");
    return {
      useNavigate: () => mockNavigate,
      useParams: () => ({ id: "w1" }),
      useLocation: () => ({ pathname: "/portal" }),
      Link: ({ to, children, ...rest }) => React.createElement("a", { href: to, ...rest }, children),
      Navigate: () => null,
    };
  },
  { virtual: true }
);
jest.mock("../features/portfolio/api");
jest.mock("../features/portfolio/workApi");
jest.mock("../features/media-library/api");

const caseApi = require("../features/portfolio/api");
const workApi = require("../features/portfolio/workApi");
const mediaApi = require("../features/media-library/api");

const WORK = [
  { _id: "w1", title: "Floraison Dental Clinic", slug: "floraison-dental-clinic", workType: "social", status: "draft", clientName: "Floraison Dental Clinic", cover: { src: "/floraison1.png" }, gallery: [], services: [], technologies: [] },
  { _id: "w2", title: "Profit Assurance", slug: "profit-assurance", workType: "website", status: "published", clientName: "Profit Assurance", caseStudy: { _id: "c1", title: "Profit Assurance" }, cover: { src: "/pat-thumb.jpg" }, shortDescription: "x", year: 2023, gallery: [], services: [], technologies: [] },
];

beforeEach(() => {
  setupDom();
  mockNavigate.mockReset();
  fillApi(caseApi, { items: [{ _id: "c1", title: "Case One", status: "published", category: "Website Design" }] });
  fillApi(workApi, { items: WORK, item: WORK[0] });
  fillApi(mediaApi, { items: [], item: {} });
});

const navLabels = (role, perms) => getNavSectionsByRole(role, perms, true).flatMap((s) => s.items.map((i) => i.label));

describe("navigation and routes", () => {
  test("Case Studies and Portfolio are separate Website items with separate permissions", () => {
    expect(navLabels("case_editor", ["portfolio.read"])).toContain("Case Studies");
    expect(navLabels("case_editor", ["portfolio.read"])).not.toContain("Portfolio");
    expect(navLabels("work_editor", ["work.read"])).toContain("Portfolio");
    expect(navLabels("work_editor", ["work.read"])).not.toContain("Case Studies");
    const website = getNavSectionsByRole("super_admin", [], true).find((s) => s.title === "Website");
    const items = website.items.map((i) => [i.label, i.to, i.permission]);
    expect(items).toEqual(expect.arrayContaining([
      ["Case Studies", "/portal/website/case-studies", "portfolio.read"],
      ["Portfolio", "/portal/website/work", "work.read"],
    ]));
    // Other Website modules are still there.
    expect(website.items.length).toBeGreaterThanOrEqual(7);
  });

  test("route gates: case studies (new and legacy URLs) need portfolio.read; portfolio work needs work.read", () => {
    signIn({ role: "case_editor", permissions: ["portfolio.read"], isInternal: true });
    expect(isAllowed("case_editor", "/portal/website/case-studies")).toBe(true);
    expect(isAllowed("case_editor", "/portal/website/case-studies/c1")).toBe(true);
    expect(isAllowed("case_editor", "/portal/website/portfolio/c1")).toBe(true);
    expect(isAllowed("case_editor", "/portal/website/work")).toBe(false);
    signIn({ role: "work_editor", permissions: ["work.read"], isInternal: true });
    expect(isAllowed("work_editor", "/portal/website/work")).toBe(true);
    expect(isAllowed("work_editor", "/portal/website/work/w1")).toBe(true);
    expect(isAllowed("work_editor", "/portal/website/case-studies")).toBe(false);
  });

  test("external roles never reach either module", () => {
    signIn({ role: "client", permissions: ["portfolio.read", "work.read"], isInternal: false });
    expect(isAllowed("client", "/portal/website/case-studies")).toBe(false);
    expect(isAllowed("client", "/portal/website/work")).toBe(false);
  });
});

describe("Case Studies admin (relabelled, same API)", () => {
  test("is titled Case Studies and opens records under the case-studies URL", async () => {
    signIn({ role: CUSTOM_INTERNAL, permissions: ["portfolio.read"], isInternal: true });
    renderPage(<PortfolioPage />);
    expect(await screen.findByText("Case One")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1, name: "Case Studies" })).toBeTruthy();
    expect(screen.getByText("Manage the case studies shown on the public website.")).toBeTruthy();
    expect(caseApi.listPortfolio).toHaveBeenCalled();
    expect(workApi.listWorkItems).not.toHaveBeenCalled();
  });
});

describe("Portfolio admin", () => {
  test("work.read only: list with covers and status, no create/archive/delete/reorder", async () => {
    signIn({ role: CUSTOM_INTERNAL, permissions: ["work.read"], isInternal: true });
    renderPage(<WorkItemsPage />);
    expect(await screen.findByText("Floraison Dental Clinic", { selector: "h3" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1, name: "Portfolio" })).toBeTruthy();
    expect(screen.getByText("Manage the visual work shown in the public Portfolio.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /new work/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /from case study/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /archive/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /move .* later/i })).toBeNull();
    // Incomplete seeded facts are flagged, not invented.
    expect(screen.getByText("Needs: Short description, Year")).toBeTruthy();
  });

  test("work.write: create, archive and reorder, but no delete", async () => {
    signIn({ role: CUSTOM_INTERNAL, permissions: ["work.read", "work.write"], isInternal: true });
    renderPage(<WorkItemsPage />);
    expect(await screen.findByRole("button", { name: "Archive Floraison Dental Clinic" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /new work/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /from case study/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^delete /i })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Move Floraison Dental Clinic later" }));
    await waitFor(() => expect(workApi.reorderWorkItems).toHaveBeenCalledWith(["w2", "w1"]));
  });

  test("work.delete: delete offered for drafts only, behind a confirmation", async () => {
    signIn({ role: CUSTOM_INTERNAL, permissions: ["work.read", "work.delete"], isInternal: true });
    renderPage(<WorkItemsPage />);
    const del = await screen.findByRole("button", { name: "Delete Floraison Dental Clinic" });
    expect(screen.queryByRole("button", { name: "Delete Profit Assurance" })).toBeNull();
    fireEvent.click(del);
    expect(await screen.findByText(/permanently delete "floraison dental clinic"/i)).toBeTruthy();
    expect(workApi.deleteWorkItem).not.toHaveBeenCalled();
  });

  test("case-study permissions alone do not grant Portfolio actions", async () => {
    signIn({ role: CUSTOM_INTERNAL, permissions: ["work.read", "portfolio.write", "portfolio.delete"], isInternal: true });
    renderPage(<WorkItemsPage />);
    await screen.findByText("Floraison Dental Clinic", { selector: "h3" });
    expect(screen.queryByRole("button", { name: /new work/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^delete /i })).toBeNull();
  });

  test("create from case study creates a new draft through the work API and opens it", async () => {
    signIn({ role: CUSTOM_INTERNAL, permissions: ["work.read", "work.write"], isInternal: true });
    workApi.createWorkItemFromCaseStudy.mockResolvedValue({ item: { _id: "w9" } });
    renderPage(<WorkItemsPage />);
    fireEvent.click(await screen.findByRole("button", { name: /from case study/i }));
    fireEvent.click(await screen.findByRole("button", { name: /case one/i }));
    await waitFor(() => expect(workApi.createWorkItemFromCaseStudy).toHaveBeenCalledWith("c1"));
    expect(caseApi.updatePortfolio).not.toHaveBeenCalled();
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/portal/website/work/w9"));
  });

  test("editor: work.read is view only; work.write saves through the work API", async () => {
    signIn({ role: CUSTOM_INTERNAL, permissions: ["work.read"], isInternal: true });
    const { unmount } = renderPage(<WorkItemDetailsPage />);
    expect(await screen.findByText(/view only/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /publish/i })).toBeNull();
    unmount();

    signIn({ role: CUSTOM_INTERNAL, permissions: ["work.read", "work.write"], isInternal: true });
    workApi.updateWorkItem.mockResolvedValue({ item: { ...WORK[0], status: "published" } });
    renderPage(<WorkItemDetailsPage />);
    expect(await screen.findByText(/still to complete/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /publish/i }));
    await waitFor(() => expect(workApi.updateWorkItem).toHaveBeenCalledWith("w1", expect.objectContaining({ status: "published", workType: "social", caseStudy: null })));
    expect(screen.queryByRole("button", { name: /delete portfolio work/i })).toBeNull();
  });
});
