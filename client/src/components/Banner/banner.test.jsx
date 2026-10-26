import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import Banner, { normalizeSlides } from "./banner";

// CRA's Jest resolver predates React Router 7's package exports.
jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn() }), { virtual: true });

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

// Slides without images: jsdom never loads images, so the preload resolves at once.
const slide = (fields) => ({ _id: "s1", title: "One partner. From plan to delivery.", subtitle: "Sample", ...fields });
const serve = (items) => {
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ ok: true, items }) }));
};
const eyebrow = async () => {
  await screen.findByRole("heading", { name: /One partner/ });
  return screen.queryByTestId("hero-eyebrow");
};

test("a blank second eyebrow stays blank: no second eyebrow and no separator", async () => {
  serve([slide({ eyebrowLeft: "YOUR DIGITAL PARTNER", eyebrowRight: "" })]);
  render(<Banner />);
  const pill = await eyebrow();
  expect(pill.textContent).toBe("YOUR DIGITAL PARTNER");
  expect(screen.queryByText("GROWTH SYSTEMS")).toBeNull();
  expect(within(pill).queryByTestId("hero-eyebrow-separator")).toBeNull();
});

test("populated eyebrows still render both values with the separator", async () => {
  serve([slide({ eyebrowLeft: "EXPRESSO DIGITAL", eyebrowRight: "CREATIVE STUDIO" })]);
  render(<Banner />);
  const pill = await eyebrow();
  expect(pill.textContent).toBe("EXPRESSO DIGITALCREATIVE STUDIO");
  expect(within(pill).getByTestId("hero-eyebrow-separator")).toBeTruthy();
});

test("both eyebrows blank: the eyebrow pill is not rendered at all", async () => {
  serve([slide({ eyebrowLeft: " ", eyebrowRight: "" })]);
  render(<Banner />);
  expect(await eyebrow()).toBeNull();
  expect(screen.queryByText("EXPRESSO DIGITAL")).toBeNull();
});

test("records that predate the eyebrow fields keep the previous defaults", () => {
  const [legacy] = normalizeSlides([{ _id: "old", title: "Legacy slide" }]);
  expect(legacy.eyebrowLeft).toBe("EXPRESSO DIGITAL");
  expect(legacy.eyebrowRight).toBe("GROWTH SYSTEMS");
  const [blank] = normalizeSlides([{ _id: "new", title: "New slide", eyebrowLeft: "DIGITAL SERVICES", eyebrowRight: "" }]);
  expect(blank.eyebrowRight).toBe("");
});

test("an API failure still shows the existing fallback slide with its eyebrows", async () => {
  global.fetch = jest.fn(async () => { throw new Error("offline"); });
  jest.spyOn(console, "error").mockImplementation(() => {});
  render(<Banner />);
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  const pill = await screen.findByTestId("hero-eyebrow");
  expect(pill.textContent).toBe("EXPRESSO DIGITALGROWTH SYSTEMS");
  console.error.mockRestore();
});
