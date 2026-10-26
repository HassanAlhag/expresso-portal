import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ServiceMainPage from "./serviceMain";

// CRA's Jest resolver predates React Router 7's package exports.
jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  useLocation: () => ({ hash: "" }),
  useNavigate: () => jest.fn(),
}), { virtual: true });
// Sections unrelated to the service list.
jest.mock("../../components/ServicesBanner/servicesBanner", () => ({ ServiceBanner: () => null }));
jest.mock("../../components/WebDevolopmentProcess/webDevelopmentProcess", () => () => null);
jest.mock("../../components/Clients/clients", () => () => null);
jest.mock("../../components/TestimonialSection/testimonialSection", () => () => null);
jest.mock("../../components/ContactUsSection/contactSection", () => () => null);
jest.mock("../../components/ContactForm/contactForm", () => () => null);
jest.mock("../../hooks/useSiteSettings", () => ({ useSiteSettings: () => ({}) }));

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
const ok = (items) => ({ ok: true, json: async () => ({ ok: true, items }) });
const SERVICE = { _id: "s1", title: "Website Development", description: "Sample", slug: "web-dev", imageUrl: "" };

test("loading is its own state: no static placeholder cards while the request is pending", async () => {
  let resolve;
  global.fetch = jest.fn(() => new Promise((done) => { resolve = done; }));
  render(<ServiceMainPage />);
  expect(screen.getByRole("status").textContent).toBe("Loading our services…");
  expect(screen.queryAllByRole("link")).toHaveLength(0);
  await act(async () => resolve(ok([SERVICE])));
  expect(screen.queryByRole("status")).toBeNull();
});

test("success renders the published services as cards", async () => {
  global.fetch = jest.fn().mockResolvedValue(ok([SERVICE]));
  render(<ServiceMainPage />);
  expect((await screen.findByRole("link", { name: "Website Development" })).getAttribute("href")).toBe("/service/web-dev");
  expect(screen.queryByRole("alert")).toBeNull();
});

test("a genuine empty result shows the empty state, not an error", async () => {
  global.fetch = jest.fn().mockResolvedValue(ok([]));
  render(<ServiceMainPage />);
  expect(await screen.findByText("Our services are being updated.")).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByRole("link", { name: "Contact our team" }).getAttribute("href")).toBe("/contact-us");
});

test.each([
  ["a network failure", () => Promise.reject(new Error("offline"))],
  ["an HTTP 500", () => Promise.resolve({ ok: false, status: 500, json: async () => ({ ok: false }) })],
  ["an invalid response", () => Promise.resolve({ ok: true, json: async () => ({ ok: true }) })],
])("%s shows an error with retry, and retry recovers", async (_label, failure) => {
  global.fetch = jest.fn(failure);
  render(<ServiceMainPage />);
  expect((await screen.findByRole("alert")).textContent).toMatch(/couldn’t load our services/);
  expect(screen.queryByText("Our services are being updated.")).toBeNull();
  global.fetch = jest.fn().mockResolvedValue(ok([SERVICE]));
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByRole("link", { name: "Website Development" })).toBeTruthy();
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
});
