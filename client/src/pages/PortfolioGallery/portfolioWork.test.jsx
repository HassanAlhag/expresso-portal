/* eslint-disable testing-library/no-node-access */
// /portfolio and /portfolio/:slug read Portfolio work items (/api/work), never
// the case-study API; case studies are linked only when one exists.
import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import PortfolioGalleryPage from "./PortfolioGalleryPage";
import PortfolioWorkPage from "./PortfolioWorkPage";
import { invalidateWorkCache } from "../../hooks/useWorkItems";

let mockSlug = "profit-assurance";
jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => jest.fn(),
  useParams: () => ({ slug: mockSlug }),
}), { virtual: true });
jest.mock("react-helmet", () => ({ Helmet: () => null }));
jest.mock("../../components/FinalCTASection/FinalCTASection", () => () => null);
jest.mock("../../hooks/useSiteSettings", () => ({ useSiteSettings: () => ({}) }));

const WEBSITE = {
  _id: "w1", slug: "profit-assurance", title: "Profit Assurance", clientName: "Profit Assurance", workType: "website", year: 2023,
  shortDescription: "We built a fast and attractive website.", cover: { src: "/pat-thumb.jpg", alt: "Profit Assurance — Website Design" },
  gallery: [{ src: "/pat5.png", alt: "Home" }, { src: "/pat6.png", alt: "Services" }], services: ["Website Design"], technologies: ["React"],
  featured: true, caseStudy: { _id: "c1", slug: "profit-assurance", title: "Profit Assurance" }, status: "published",
};
const SOCIAL = {
  _id: "w2", slug: "floraison-dental-clinic", title: "Floraison Dental Clinic", clientName: "Floraison Dental Clinic", workType: "social",
  cover: { src: "/floraison1.png" }, gallery: [{ src: "/floraison1.png" }, { src: "/floraison2.png" }], services: [], technologies: [], caseStudy: null, status: "published",
};
const VISUAL_ONLY = {
  _id: "w3", slug: "sudatel", title: "Sudatel", clientName: "Sudatel Telecom Group", workType: "website", cover: { src: "/s.png" }, gallery: [],
  services: [], technologies: [], caseStudy: null, status: "published",
};

const listOk = (items) => ({ ok: true, json: async () => ({ ok: true, items }) });
const itemOk = (item) => ({ ok: true, status: 200, json: async () => ({ ok: true, item }) });

const originalFetch = global.fetch;
beforeEach(() => invalidateWorkCache());
afterEach(() => {
  global.fetch = originalFetch;
  mockSlug = "profit-assurance";
});

describe("/portfolio", () => {
  test("reads work items from /api/work, never the case-study API", async () => {
    global.fetch = jest.fn().mockResolvedValue(listOk([WEBSITE, SOCIAL, VISUAL_ONLY]));
    render(<PortfolioGalleryPage />);
    expect(await screen.findByRole("heading", { level: 3, name: "Floraison Dental Clinic" })).toBeTruthy();
    const urls = global.fetch.mock.calls.map((c) => String(c[0]));
    expect(urls.every((u) => /\/work\?/.test(u))).toBe(true);
    expect(urls.some((u) => /\/portfolio/.test(u))).toBe(false);
  });

  test("filters come from the data (no empty Google Ads/SEO tabs) and filter the grid", async () => {
    global.fetch = jest.fn().mockResolvedValue(listOk([WEBSITE, SOCIAL, VISUAL_ONLY]));
    render(<PortfolioGalleryPage />);
    const group = await screen.findByRole("group", { name: /filter work by type/i });
    const names = within(group).getAllByRole("button").map((b) => b.textContent);
    expect(names).toEqual(["All work3", "Websites2", "Social Media1"]);
    fireEvent.click(within(group).getByRole("button", { name: /social media/i }));
    const grid = document.getElementById("work");
    await waitFor(() => expect(within(grid).queryByRole("heading", { level: 3, name: "Sudatel" })).toBeNull());
    expect(within(grid).getByRole("heading", { level: 3, name: "Floraison Dental Clinic" })).toBeTruthy();
    expect(within(group).getByRole("button", { name: /social media/i }).getAttribute("aria-pressed")).toBe("true");
  });

  test("View Case Study appears only for linked work; unlinked work never fakes one", async () => {
    global.fetch = jest.fn().mockResolvedValue(listOk([WEBSITE, SOCIAL, VISUAL_ONLY]));
    render(<PortfolioGalleryPage />);
    await screen.findByRole("heading", { level: 3, name: "Sudatel" });
    const caseLinks = screen.getAllByRole("link", { name: /view case study/i });
    expect(caseLinks.length).toBeGreaterThan(0);
    expect(caseLinks.every((a) => a.getAttribute("href") === "/case-studies/c1")).toBe(true);
    // Sudatel has nothing more to show and no case study: its tile is not a link.
    expect(screen.queryByRole("link", { name: "Sudatel" })).toBeNull();
    expect(screen.getByRole("link", { name: "Floraison Dental Clinic" }).getAttribute("href")).toBe("/portfolio/floraison-dental-clinic");
  });

  test("featured work leads the mosaic as a wide card, shown once", async () => {
    global.fetch = jest.fn().mockResolvedValue(listOk([WEBSITE, SOCIAL, VISUAL_ONLY]));
    render(<PortfolioGalleryPage />);
    expect(await screen.findByText("Featured")).toBeTruthy();
    expect(screen.getByText("We built a fast and attractive website.")).toBeTruthy();
    // The featured card spans exactly the grid's columns (a fixed span wider
    // than a 2-column grid adds empty tracks and collapses the other tiles).
    expect(screen.getByText("Featured").closest("li").className).toBe("col-span-full");
    // The featured item is not repeated as a regular tile in "All work".
    expect(screen.getAllByRole("heading", { level: 3, name: "Profit Assurance" })).toHaveLength(1);
    // A type filter shows it as a regular tile instead.
    const group = screen.getByRole("group", { name: /filter work by type/i });
    fireEvent.click(within(group).getByRole("button", { name: /websites/i }));
    await waitFor(() => expect(screen.queryByText("Featured")).toBeNull());
    expect(screen.getAllByRole("heading", { level: 3, name: "Profit Assurance" })).toHaveLength(1);
  });

  test("empty and error states", async () => {
    global.fetch = jest.fn().mockResolvedValue(listOk([]));
    const { unmount } = render(<PortfolioGalleryPage />);
    expect(await screen.findByText("Our portfolio is being updated.")).toBeTruthy();
    unmount();
    invalidateWorkCache();
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ ok: false }) });
    render(<PortfolioGalleryPage />);
    expect((await screen.findByRole("alert")).textContent).toMatch(/couldn’t load our portfolio/);
    global.fetch = jest.fn().mockResolvedValue(listOk([SOCIAL]));
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { level: 3, name: "Floraison Dental Clinic" })).toBeTruthy();
  });
});

describe("/portfolio/:slug", () => {
  test("light detail page: facts, gallery and a case-study link, no case-study narrative", async () => {
    global.fetch = jest.fn((url) => Promise.resolve(String(url).includes("/work/") ? itemOk(WEBSITE) : listOk([WEBSITE, SOCIAL])));
    render(<PortfolioWorkPage />);
    expect(await screen.findByRole("heading", { level: 1, name: "Profit Assurance" })).toBeTruthy();
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/work\/profit-assurance$/));
    expect(screen.getByText("React")).toBeTruthy();
    expect(screen.getAllByText("2023").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Enlarge: Home" })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: /view case study/i }).every((a) => a.getAttribute("href") === "/case-studies/c1")).toBe(true);
    for (const t of [/the challenge/i, /how we solved it/i, /the outcome/i]) expect(screen.queryByRole("heading", { name: t })).toBeNull();
  });

  test("gallery lightbox steps through images with arrows and keys, wrapping around", async () => {
    global.fetch = jest.fn((url) => Promise.resolve(String(url).includes("/work/") ? itemOk(WEBSITE) : listOk([WEBSITE])));
    render(<PortfolioWorkPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Enlarge: Home" }));
    const dialog = () => screen.getByRole("dialog");
    expect(within(dialog()).getByText("1 / 2")).toBeTruthy();
    expect(within(dialog()).getByRole("img").getAttribute("src")).toBe("/pat5.png");
    fireEvent.click(within(dialog()).getByRole("button", { name: "Next image" }));
    expect(within(dialog()).getByRole("img").getAttribute("src")).toBe("/pat6.png");
    expect(within(dialog()).getByText("2 / 2")).toBeTruthy();
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(within(dialog()).getByRole("img").getAttribute("src")).toBe("/pat5.png");
    fireEvent.click(within(dialog()).getByRole("button", { name: "Previous image" }));
    expect(within(dialog()).getByRole("img").getAttribute("alt")).toBe("Services");
  });

  test("one video player; arrows switch videos, a legacy single video comes first", async () => {
    const item = {
      ...SOCIAL,
      video: { src: "/legacy.mp4", poster: "" },
      videos: [{ src: "/reel-1.mp4", title: "Launch reel" }, { src: "https://www.youtube.com/watch?v=x", title: "" }],
    };
    mockSlug = item.slug;
    global.fetch = jest.fn((url) => Promise.resolve(String(url).includes("/work/") ? itemOk(item) : listOk([item])));
    render(<PortfolioWorkPage />);
    await screen.findByRole("heading", { level: 1, name: item.title });
    const section = screen.getByRole("heading", { level: 2, name: /videos$/ }).closest("section");
    const playing = () => [...section.querySelectorAll("video source")].map((p) => p.getAttribute("src"));
    expect(playing()).toEqual(["/legacy.mp4"]);
    expect(within(section).getByText("1 / 3")).toBeTruthy();
    // A large play button sits over the paused video and starts it.
    const videoEl = section.querySelector("video");
    videoEl.play = jest.fn(() => Promise.resolve());
    fireEvent.click(within(section).getByRole("button", { name: /^Play / }));
    expect(videoEl.play).toHaveBeenCalled();
    fireEvent.play(videoEl);
    expect(within(section).queryByRole("button", { name: /^Play / })).toBeNull();
    fireEvent.pause(videoEl);
    expect(within(section).getByRole("button", { name: /^Play / })).toBeTruthy();
    fireEvent.click(within(section).getByRole("button", { name: "Next video" }));
    expect(playing()).toEqual(["/reel-1.mp4"]);
    expect(within(section).getByText("Launch reel")).toBeTruthy();
    fireEvent.click(within(section).getByRole("button", { name: "Next video" }));
    expect(playing()).toEqual([]);
    expect(within(section).getByRole("link", { name: /watch the video/i }).getAttribute("href")).toBe("https://www.youtube.com/watch?v=x");
    fireEvent.click(within(section).getByRole("button", { name: "Next video" }));
    expect(playing()).toEqual(["/legacy.mp4"]);
    fireEvent.click(within(section).getByRole("button", { name: "Previous video" }));
    expect(within(section).getByText("3 / 3")).toBeTruthy();
  });

  test("work without a case study has no case-study link", async () => {
    mockSlug = "floraison-dental-clinic";
    global.fetch = jest.fn((url) => Promise.resolve(String(url).includes("/work/") ? itemOk(SOCIAL) : listOk([SOCIAL])));
    render(<PortfolioWorkPage />);
    expect(await screen.findByRole("heading", { level: 1, name: "Floraison Dental Clinic" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /view case study/i })).toBeNull();
  });

  test("HTTP 404 shows not found", async () => {
    mockSlug = "missing";
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({ ok: false }) });
    render(<PortfolioWorkPage />);
    expect(await screen.findByText("Project not found.")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
