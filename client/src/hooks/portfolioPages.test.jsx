import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { invalidatePortfolioCache } from "./usePortfolioItems";
import PortfolioGalleryPage from "../pages/PortfolioGallery/PortfolioGalleryPage";
import PortfolioGrid from "../components/PortfolioComponents/portfolioList";
import PortfolioDetailPage from "../pages/SingleViewPortfolio/singleViewPortfolio";

// CRA's Jest resolver predates React Router 7's package exports.
jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => jest.fn(),
  useParams: () => ({ id: "p1" }),
}), { virtual: true });
jest.mock("../components/ServicesBanner/servicesBanner", () => ({ ServiceBanner: () => null }));
jest.mock("../components/FinalCTASection/FinalCTASection", () => () => null);
jest.mock("../components/ContactForm/contactForm", () => () => null);
jest.mock("../hooks/useSiteSettings", () => ({ useSiteSettings: () => ({}) }));
jest.mock("react-lazy-load-image-component", () => ({ LazyLoadImage: (props) => <img alt={props.alt} src={props.src} /> }));

// jsdom has no IntersectionObserver; the gallery's scroll animations need one.
beforeAll(() => {
  global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
});

const originalFetch = global.fetch;
beforeEach(() => invalidatePortfolioCache());
afterEach(() => { global.fetch = originalFetch; });

const ITEM = { _id: "p1", title: "Sample brand refresh", clientName: "Sample Client", category: "Website Design", imageUrls: [], problems: [], solutions: [] };
const list = (items) => ({ ok: true, json: async () => ({ ok: true, items }) });
const one = (item) => ({ ok: true, status: 200, json: async () => ({ ok: true, item }) });
const failures = [
  ["a network failure", () => Promise.reject(new Error("offline"))],
  ["an HTTP 500", () => Promise.resolve({ ok: false, status: 500, json: async () => ({ ok: false }) })],
];

describe.each([
  ["/portfolio gallery", () => <PortfolioGalleryPage />],
  ["/case-studies grid", () => <PortfolioGrid />],
])("%s", (_name, view) => {
  test("a genuine empty result shows the empty state, not an error", async () => {
    global.fetch = jest.fn().mockResolvedValue(list([]));
    render(view());
    expect(await screen.findByText("Our portfolio is being updated.")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test.each(failures)("%s shows an error with retry, and retry recovers", async (_label, failure) => {
    global.fetch = jest.fn(failure);
    render(view());
    expect((await screen.findByRole("alert")).textContent).toMatch(/couldn’t load our portfolio/);
    expect(screen.queryByText("Our portfolio is being updated.")).toBeNull();
    global.fetch = jest.fn().mockResolvedValue(list([ITEM]));
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(screen.queryByText("Our portfolio is being updated.")).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/portfolio?status=published"));
  });

  test("published records render with no status message", async () => {
    global.fetch = jest.fn().mockResolvedValue(list([ITEM]));
    render(view());
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByText("Our portfolio is being updated.")).toBeNull();
  });
});

describe("/case-studies/:id detail", () => {
  const route = (detail) => jest.fn((url) => (String(url).includes("/portfolio/p1") ? detail() : Promise.resolve(list([ITEM]))));

  test("HTTP 404 shows not found, not an error", async () => {
    global.fetch = route(() => Promise.resolve({ ok: false, status: 404, json: async () => ({ ok: false }) }));
    render(<PortfolioDetailPage />);
    expect(await screen.findByText("Project not found.")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test.each(failures)("%s shows an error with retry instead of 'not found', and retry recovers", async (_label, failure) => {
    global.fetch = route(failure);
    render(<PortfolioDetailPage />);
    expect((await screen.findByRole("alert")).textContent).toMatch(/couldn’t load this project/);
    expect(screen.queryByText("Project not found.")).toBeNull();
    expect(screen.getByRole("link", { name: "All case studies" }).getAttribute("href")).toBe("/case-studies");
    global.fetch = route(() => Promise.resolve(one(ITEM)));
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(screen.queryByText("Project not found.")).toBeNull();
  });
});
