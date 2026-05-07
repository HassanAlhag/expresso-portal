import React from "react";
import { FaCheck } from "react-icons/fa";

const BRAND = "#7F8AD1";

const PortfolioCaseStudy = ({
  clientName,
  category,
  startDate,
  endDate,
  introDescription,
  problems,
  solutions = [],
  solutionImage,
  result,
}) => {
  const infoItems = [
    { label: "CLIENT", value: clientName },
    { label: "CATEGORY", value: category },
    { label: "START DATE", value: startDate },
    { label: "END DATE", value: endDate },
  ];

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        {/* ✅ ONE BOX: HEADER + CLIENT INFO */}
        <div className="mb-10 overflow-hidden rounded-3xl border border-neutral-200 shadow-[0_22px_70px_rgba(0,0,0,0.12)]">
          {/* TOP (BLACK) */}
          <div className="relative bg-neutral-950 px-6 py-7 text-white md:px-8 md:py-8">
            {/* subtle glow */}
            <div
              className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl"
              style={{ backgroundColor: BRAND, opacity: 0.14 }}
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_60%)]" />

            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold tracking-[0.22em] text-white/80 backdrop-blur">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: BRAND }}
                />
                CASE STUDY
              </div>

              <div className="text-sm text-white/70">
                Strategy • Design • Performance
              </div>
            </div>

            <h2 className="relative mt-5 text-3xl font-black tracking-tight md:text-4xl">
              Project Breakdown<span style={{ color: BRAND }}>.</span>
            </h2>

            <p className="relative mt-3 max-w-3xl text-lg leading-relaxed text-white/75 md:text-xl">
              A clear overview — what we faced, what we delivered, and the
              outcome.
            </p>
          </div>

          {/* DIVIDER / ACCENT LINE */}
          <div
            className="h-[3px] w-full"
            style={{
              background:
                "linear-gradient(90deg, rgba(127,138,209,1) 0%, rgba(127,138,209,0.40) 55%, rgba(0,0,0,0) 100%)",
            }}
          />

          {/* BOTTOM (LIGHT INFO STRIP) */}
          <div className="bg-neutral-50 px-6 py-7 md:px-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {infoItems.map((it) => (
                <div key={it.label} className="min-w-0">
                  <p className="text-xs font-extrabold tracking-[0.32em] text-neutral-500">
                    {it.label}
                  </p>
                  <p className="mt-3 truncate text-xl font-black tracking-tight text-neutral-950 md:text-2xl">
                    {it.value || "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid gap-8 md:grid-cols-12">
          {/* LEFT COLUMN */}
          <div className="space-y-7 md:col-span-7">
            <BigBlock title="Overview" badge="01">
              <p className="text-lg leading-relaxed text-neutral-800 md:text-xl">
                {introDescription}
              </p>
            </BigBlock>

            <BigBlock title="Challenge" badge="02">
              <p className="text-lg leading-relaxed text-neutral-800 md:text-xl">
                {problems}
              </p>
            </BigBlock>

            <BigBlock title="Result" badge="03" accent>
              <p className="text-lg leading-relaxed text-neutral-800 md:text-xl">
                {result}
              </p>
            </BigBlock>
          </div>

          {/* RIGHT COLUMN */}
          <div className="md:col-span-5">
            <div className="sticky top-24">
              <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_18px_60px_rgba(0,0,0,0.10)]">
                {/* Image */}
                {solutionImage ? (
                  <div className="relative h-[260px] w-full">
                    <img
                      src={solutionImage}
                      alt="Solution Visual"
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-black/0" />
                    <div
                      className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full blur-3xl"
                      style={{ backgroundColor: BRAND, opacity: 0.18 }}
                    />
                  </div>
                ) : (
                  <div className="p-6 text-base text-neutral-500">
                    Add a solution image (optional).
                  </div>
                )}

                {/* Solutions */}
                <div className="p-6 md:p-7">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl font-black tracking-tight text-neutral-950 md:text-2xl">
                      Solutions Delivered
                    </h3>
                    <span
                      className="h-2 w-14 rounded-full"
                      style={{ backgroundColor: BRAND, opacity: 0.45 }}
                    />
                  </div>

                  <p className="mt-2 text-base text-neutral-600 md:text-lg">
                    Key deliverables shipped for this project:
                  </p>

                  <ul className="mt-6 space-y-4">
                    {(solutions || []).map((s, i) => (
                      <li key={i} className="flex items-start gap-4">
                        <span
                          className="mt-1 inline-flex h-9 w-9 flex-none items-center justify-center rounded-2xl"
                          style={{
                            backgroundColor: "rgba(127,138,209,0.16)",
                            color: BRAND,
                          }}
                        >
                          <FaCheck className="text-sm" />
                        </span>
                        <p className="text-lg leading-relaxed text-neutral-800 md:text-xl">
                          {s}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm font-semibold text-neutral-700">
                      Built to be clean, consistent, and conversion-first.
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      Focused on usability, speed, and brand alignment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 h-px w-full bg-neutral-200" />
      </div>
    </section>
  );
};

/* ----------------------- Local Components (same file) ---------------------- */

const BigBlock = ({ title, badge, children, accent = false }) => {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_14px_44px_rgba(0,0,0,0.06)] md:p-7">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black"
            style={{
              backgroundColor: accent
                ? "rgba(127,138,209,0.20)"
                : "rgba(0,0,0,0.06)",
              color: accent ? BRAND : "#111827",
            }}
          >
            {badge}
          </span>
          <h3 className="text-2xl font-black tracking-tight text-neutral-950 md:text-3xl">
            {title}
          </h3>
        </div>

        <span
          className="h-2 w-16 rounded-full"
          style={{
            backgroundColor: accent ? BRAND : "#E5E7EB",
            opacity: accent ? 0.55 : 1,
          }}
        />
      </div>

      {children}
    </div>
  );
};

export default PortfolioCaseStudy;
