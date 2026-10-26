import React from "react";
import { render, screen, within } from "@testing-library/react";
import HomepageSlideFormModal from "./components/HomepageSlideFormModal";
import HomepageSlidePreview from "./components/HomepageSlidePreview";
import { EMPTY_HOMEPAGE_SLIDE } from "./constants/homepageSlides.constants";

// The media picker loads the library over the API; not needed for these checks.
jest.mock("../media-library/components/MediaPickerModal", () => () => null);

const field = (label) => screen.getByLabelText(label);

test("a new slide starts with a blank second eyebrow (no GROWTH SYSTEMS default)", () => {
  expect(EMPTY_HOMEPAGE_SLIDE.eyebrowRight).toBe("");
  render(<HomepageSlideFormModal open initial={null} onClose={() => {}} onSubmit={() => {}} />);
  expect(field("EYEBROW RIGHT").value).toBe("");
  expect(field("EYEBROW LEFT").value).toBe("EXPRESSO DIGITAL");
  expect(screen.queryByText("GROWTH SYSTEMS")).toBeNull();
});

test("editing loads stored values exactly, including an intentionally blank eyebrow", () => {
  const slide = { _id: "s1", title: "Software built by Expresso.", eyebrowLeft: "DIGITAL SOLUTIONS", eyebrowRight: "" };
  render(<HomepageSlideFormModal open initial={slide} onClose={() => {}} onSubmit={() => {}} />);
  expect(field("EYEBROW LEFT").value).toBe("DIGITAL SOLUTIONS");
  expect(field("EYEBROW RIGHT").value).toBe("");
});

test("editing a populated slide keeps both eyebrows", () => {
  const slide = { _id: "s2", title: "Sample", eyebrowLeft: "EXPRESSO DIGITAL", eyebrowRight: "CREATIVE STUDIO" };
  render(<HomepageSlideFormModal open initial={slide} onClose={() => {}} onSubmit={() => {}} />);
  expect(field("EYEBROW RIGHT").value).toBe("CREATIVE STUDIO");
});

test("editing a legacy record without eyebrow fields shows what the website shows", () => {
  render(<HomepageSlideFormModal open initial={{ _id: "old", title: "Legacy" }} onClose={() => {}} onSubmit={() => {}} />);
  expect(field("EYEBROW LEFT").value).toBe("EXPRESSO DIGITAL");
  expect(field("EYEBROW RIGHT").value).toBe("GROWTH SYSTEMS");
});

test("the preview hides a blank second eyebrow and its separator, and shows populated ones", () => {
  const { rerender } = render(<HomepageSlidePreview slide={{ eyebrowLeft: "YOUR DIGITAL PARTNER", eyebrowRight: "" }} />);
  const pill = screen.getByTestId("slide-preview-eyebrow");
  expect(pill.textContent).toBe("YOUR DIGITAL PARTNER");
  expect(screen.queryByText("GROWTH SYSTEMS")).toBeNull();
  rerender(<HomepageSlidePreview slide={{ eyebrowLeft: "EXPRESSO DIGITAL", eyebrowRight: "CREATIVE STUDIO" }} />);
  expect(within(screen.getByTestId("slide-preview-eyebrow")).getByText("CREATIVE STUDIO")).toBeTruthy();
  rerender(<HomepageSlidePreview slide={{ eyebrowLeft: "", eyebrowRight: "" }} />);
  expect(screen.queryByTestId("slide-preview-eyebrow")).toBeNull();
});
