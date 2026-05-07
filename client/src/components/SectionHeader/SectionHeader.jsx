// src/components/SectionHeader/SectionHeader.jsx
import React from "react";

const BRAND = "#7F8AD1";

export default function SectionHeader({
  highlight = "Section",
  title = "Title",
  description = "",
  align = "center", // "center" | "left"
  className = "",
}) {
  const alignWrap =
    align === "left" ? "text-left items-start" : "text-center items-center";
  const alignText = align === "left" ? "mx-0" : "mx-auto";

  return (
    <div className={`mb-2 md:mb-1 flex flex-col ${alignWrap} ${className}`}>
      <h1 className="mx-auto max-w-4xl font-dax-compact text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl md:text-5xl">
        <span style={{ color: BRAND }}>{highlight}</span>{" "}
        <span className="text-neutral-950">{title}</span>
      </h1>

      {description ? (
        <p
          className={`${alignText} mt-4 max-w-3xl whitespace-pre-line text-base leading-relaxed text-neutral-600 sm:text-lg`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
