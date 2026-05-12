import React, { useEffect, useMemo, useRef } from "react";
import { animate, useInView } from "framer-motion";
import HomeSection from "../HomeSection/HomeSection";

const BRAND = "#7F8AD1";

export const CountUpStats = ({ stats = [], heading, subtitle }) => {
  return (
    <HomeSection
      eyebrow={heading?.eyebrow || "RESULTS"}
      title={heading?.textBefore || "Drive success with"}
      highlight={heading?.highlight || "Expresso Digital"}
      subtitle={
        subtitle ||
        "A quick snapshot of the kind of growth-focused outcomes we help brands achieve."
      }
      align="center"
      className="bg-neutral-50/70"
    >
      <div className="grid gap-5 md:grid-cols-3">
        {stats.map((stat, index) => (
          <Stat
            key={index}
            num={stat.num}
            suffix={stat.suffix}
            decimals={stat.decimals}
            subheading={stat.subheading}
          />
        ))}
      </div>
    </HomeSection>
  );
};

const Stat = ({ num, suffix = "", decimals = 0, subheading }) => {
  const spanRef = useRef(null);
  const isInView = useInView(spanRef, { once: true, amount: 0.4 });

  const fmt = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
    [decimals]
  );

  useEffect(() => {
    if (!isInView || !spanRef.current) return;

    const controls = animate(0, num, {
      duration: 2.2,
      ease: "easeOut",
      onUpdate(value) {
        if (!spanRef.current) return;
        spanRef.current.textContent = fmt.format(value);
      },
    });

    return () => controls.stop();
  }, [num, isInView, fmt]);

  return (
    <div className="group relative overflow-hidden text-center rounded-3xl border border-neutral-200 bg-white px-7 py-9 shadow-[0_8px_24px_rgba(0,0,0,0.05)] transition duration-300 hover:-translate-y-1.5 hover:border-[rgba(127,138,209,0.30)] hover:shadow-[0_22px_60px_rgba(127,138,209,0.11)]">
      {/* Top accent bar — appears on hover */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px] rounded-t-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, ${BRAND}, #A8B1EF)`,
        }}
      />

      <p className="text-5xl font-black tracking-tight text-neutral-900 md:text-6xl">
        <span ref={spanRef} />
        <span className="text-neutral-400">{suffix}</span>
      </p>

      <p className="mx-auto mt-4 max-w-[18rem] text-sm leading-relaxed text-neutral-500 md:text-base">
        {subheading}
      </p>

      <div
        className="mx-auto mt-6 h-px w-12 rounded-full bg-neutral-200 transition-all duration-300 group-hover:w-20"
        style={{
          background: undefined,
        }}
      />
    </div>
  );
};
