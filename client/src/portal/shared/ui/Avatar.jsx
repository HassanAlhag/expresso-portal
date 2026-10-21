import React from "react";

export function initialsOf(name) {
  return String(name || "")
    .split(/\s+/)
    .filter((w) => /^[A-Za-zÀ-ɏ]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";
}

export default function Avatar({ name, src, size = 32, className = "" }) {
  return (
    <span
      className={["px-avatar", className].filter(Boolean).join(" ")}
      style={size !== 32 ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      {src ? <img src={src} alt="" /> : initialsOf(name)}
    </span>
  );
}
