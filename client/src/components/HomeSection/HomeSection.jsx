import React from "react";

const BRAND = "#7F8AD1";

export default function HomeSection({
  eyebrow,
  title,
  highlight,
  subtitle,
  align = "center",
  theme = "light",
  className = "",
  children,
}) {
  const isDark = theme === "dark";

  return (
    <section className={`relative py-16 md:py-24 ${className}`}>
      <div className="mx-auto w-[min(1200px,92vw)]">
        <div
          className={[
            "mb-10 md:mb-14",
            align === "center" ? "text-center max-w-3xl mx-auto" : "max-w-2xl",
          ].join(" ")}
        >
          {eyebrow ? (
            <div
              className={[
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.18em]",
                isDark
                  ? "border-white/10 bg-white/5 text-white/70"
                  : "border-[rgba(127,138,209,0.22)] bg-[rgba(127,138,209,0.07)] text-[#5762b8]",
              ].join(" ")}
            >
              <span
                className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: BRAND }}
              />
              {eyebrow}
            </div>
          ) : null}

          <h2
            className={[
              "mt-4 font-dax-compact text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl",
              isDark ? "text-white" : "text-neutral-950",
            ].join(" ")}
          >
            {title}{" "}
            {highlight ? (
              <span style={{ color: BRAND }}>{highlight}</span>
            ) : null}
          </h2>

          {subtitle ? (
            <p
              className={[
                "mt-4 text-base leading-relaxed md:text-lg",
                isDark ? "text-white/65" : "text-neutral-500",
              ].join(" ")}
            >
              {subtitle}
            </p>
          ) : null}
        </div>

        {children}
      </div>
    </section>
  );
}
