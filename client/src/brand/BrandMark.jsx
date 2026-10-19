import React from "react";

// The Expresso lotus, cut directly from the official logo artwork
// (public/brand/lotus-mark.png). It is rendered as a CSS mask so it can take
// any brand colour while its shape stays exactly the logo's.
//
// Usage rules (approved design direction):
// - The mark means something: Expresso-owned, selected, important. It is not
//   decoration and never goes on every card in a list (≈ one per card group).
// - Colourways: lotus (default), white, espresso — or a Lotus scale token.
// - Minimum 20px wide on screen; keep clear space ≥ 1/4 of its width.
const MARK_SRC = "/brand/lotus-mark.png";
const ASPECT = 102 / 179; // height / width of the source artwork

const TONES = {
  lotus: "#8390C8",
  white: "#FFFFFF",
  espresso: "#562D0F",
  "lotus-300": "#A9B1DD",
  "lotus-600": "#5562A8",
  "lotus-200": "#CED3EC",
};

export default function BrandMark({
  size = 24,
  tone = "lotus",
  title,
  className = "",
  style,
}) {
  const color = TONES[tone] || tone;
  const width = Math.max(12, size);
  const height = Math.round(width * ASPECT);
  const mask = `url(${MARK_SRC}) center / contain no-repeat`;

  return (
    <span
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={`inline-block shrink-0 ${className}`}
      style={{
        width,
        height,
        backgroundColor: color,
        WebkitMask: mask,
        mask,
        ...style,
      }}
    />
  );
}
