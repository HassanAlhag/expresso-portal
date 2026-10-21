import React from "react";

// One status system (PUI-1): ok / warn / bad / info / idle (+ outline).
// The older tone names used across the portal map onto it.
const TONE = {
  neutral: "",
  idle: "",
  info: "px-badge--info",
  blue: "px-badge--info",
  violet: "px-badge--info",
  success: "px-badge--ok",
  ok: "px-badge--ok",
  warning: "px-badge--warn",
  warn: "px-badge--warn",
  danger: "px-badge--bad",
  bad: "px-badge--bad",
  outline: "px-badge--outline",
};

export default function Badge({ children, tone = "neutral", dot = false, className = "", size = "sm" }) {
  return (
    <span
      className={[
        "px-badge capitalize",
        TONE[tone] ?? "",
        dot ? "px-badge--dot" : "",
        size === "xs" ? "!h-5 !px-2 !text-[11px]" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
