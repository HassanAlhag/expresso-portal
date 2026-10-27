// PI closure — CMS pages (media, website, portfolio, careers) follow the
// same permissions the API enforces: read views, write mutates, delete deletes.
import React from "react";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { signIn, renderPage, fillApi, setupDom, CUSTOM_INTERNAL } from "./piClosure.test.helpers";
import MediaLibraryPage from "../features/media-library/pages/MediaLibraryPage";
import MediaPickerModal from "../features/media-library/components/MediaPickerModal";
import DigitalServicesPage from "../features/website/pages/DigitalServicesPage";
import TechSolutionsPage from "../features/website/pages/TechSolutionsPage";
import PortfolioPage from "../features/portfolio/pages/PortfolioPage";
import CareersAdminPage from "../features/careers/pages/CareersAdminPage";

jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");
    return {
      useNavigate: () => jest.fn(),
      useParams: () => ({ id: "x1" }),
      useLocation: () => ({ pathname: "/portal" }),
      Link: ({ to, children, ...rest }) => React.createElement("a", { href: to, ...rest }, children),
    };
  },
  { virtual: true }
);
jest.mock("../features/media-library/api");
jest.mock("../features/website/api");
jest.mock("../features/portfolio/api");
jest.mock("../features/careers/api");

const mediaApi = require("../features/media-library/api");
const websiteApi = require("../features/website/api");
const portfolioApi = require("../features/portfolio/api");
const careersApi = require("../features/careers/api");

const svc = { _id: "s1", title: "Brand Strategy", slug: "brand", isActive: true, blocks: [] };
beforeEach(() => {
  setupDom();
  fillApi(mediaApi, { items: [], item: {} });
  fillApi(websiteApi, { items: [svc], groups: [], item: svc });
  fillApi(portfolioApi, { items: [{ _id: "p1", title: "Case One", status: "draft" }] });
  fillApi(careersApi, { items: [], item: {} });
});

describe("Media library", () => {
  it("media.read only: no Upload control", async () => {
    signIn({ role: "staff", permissions: ["media.read"] });
    renderPage(<MediaLibraryPage />);
    await waitFor(() => expect(mediaApi.listMedia).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: /upload/i })).toBeNull();
  });
  it("media.write (custom internal role): Upload offered", async () => {
    signIn({ role: CUSTOM_INTERNAL, permissions: ["media.read", "media.write"], isInternal: true });
    renderPage(<MediaLibraryPage />);
    expect(await screen.findByRole("button", { name: /upload/i })).toBeTruthy();
  });
  it("built-in admin without media.write: no Upload (no name-based bypass)", async () => {
    signIn({ role: "admin", permissions: ["media.read"] });
    renderPage(<MediaLibraryPage />);
    await waitFor(() => expect(mediaApi.listMedia).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: /upload/i })).toBeNull();
  });
  it("picker without media.read does not browse the library", async () => {
    signIn({ role: "staff", permissions: ["portfolio.write"] });
    renderPage(<MediaPickerModal open onClose={() => {}} onSelect={() => {}} allowUpload />);
    expect(await screen.findByText(/media library isn't available to you/i)).toBeTruthy();
    expect(mediaApi.listMedia).not.toHaveBeenCalled();
  });
});

describe.each([
  ["Digital services", DigitalServicesPage, /add service/i],
  ["Tech solutions", TechSolutionsPage, /add solution/i],
])("%s (website.write)", (_label, Page, addName) => {
  it("website.read only: list visible, no add/edit/delete/toggle, not draggable", async () => {
    signIn({ role: "staff", permissions: ["website.read"] });
    renderPage(<Page />);
    expect(await screen.findByText("Brand Strategy")).toBeTruthy();
    expect(screen.queryByRole("button", { name: addName })).toBeNull();
    expect(screen.queryByRole("button", { name: /edit brand strategy/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /delete brand strategy/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /deactivate brand strategy/i })).toBeNull();
    // Drag-to-reorder has no accessible role; check the attribute directly.
    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelector('[draggable="true"]')).toBeNull();
  });
  it("website.write (custom internal role): all row actions available", async () => {
    signIn({ role: CUSTOM_INTERNAL, permissions: ["website.read", "website.write"], isInternal: true });
    renderPage(<Page />);
    expect(await screen.findByText("Brand Strategy")).toBeTruthy();
    expect(screen.getByRole("button", { name: addName })).toBeTruthy();
    expect(screen.getByRole("button", { name: /edit brand strategy/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /delete brand strategy/i })).toBeTruthy();
    // Drag-to-reorder has no accessible role; check the attribute directly.
    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelector('[draggable="true"]')).not.toBeNull();
  });
});

describe("Portfolio", () => {
  it("portfolio.read only: no New item, no delete", async () => {
    signIn({ role: "staff", permissions: ["portfolio.read"] });
    renderPage(<PortfolioPage />);
    expect(await screen.findByText("Case One")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /new item/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /delete case one/i })).toBeNull();
  });
  it("portfolio.write without delete: create but no delete", async () => {
    signIn({ role: "admin", permissions: ["portfolio.read", "portfolio.write"] });
    renderPage(<PortfolioPage />);
    expect(await screen.findByRole("button", { name: /new item/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /delete case one/i })).toBeNull();
  });
  it("portfolio.delete: delete offered", async () => {
    signIn({ role: CUSTOM_INTERNAL, permissions: ["portfolio.read", "portfolio.delete"], isInternal: true });
    renderPage(<PortfolioPage />);
    expect(await screen.findByRole("button", { name: /delete case one/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /new item/i })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /delete case one/i }));
    expect(await screen.findByText(/delete "case one"\?/i)).toBeTruthy();
  });
});

describe("Careers admin", () => {
  it("website.read only: no New opening", async () => {
    signIn({ role: "staff", permissions: ["website.read"] });
    renderPage(<CareersAdminPage />);
    await waitFor(() => expect(Object.values(careersApi).some((f) => f.mock && f.mock.calls.length)).toBe(true));
    expect(screen.queryByRole("button", { name: /new opening/i })).toBeNull();
  });
  it("website.write: New opening offered", async () => {
    signIn({ role: "staff", permissions: ["website.read", "website.write"] });
    renderPage(<CareersAdminPage />);
    expect(await screen.findByRole("button", { name: /new opening/i })).toBeTruthy();
  });
});
