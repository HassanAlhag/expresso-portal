import React from "react";
import { motion } from "framer-motion";
import { FiCheckCircle } from "react-icons/fi";
import { BRAND, BRAND_BG } from "../../data/technologySolutionsData";

export default function SolutionSplitBlock({
  eyebrow,
  title,
  desc,
  points = [],
  accentColor = BRAND,
  accentBg = BRAND_BG,
}) {
  return (
    <section className="py-20">
      <div className="mx-auto grid w-[min(1200px,92vw)] gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          {eyebrow && (
            <span
              className="inline-block rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest"
              style={{
                borderColor: accentColor,
                backgroundColor: accentBg,
                color: accentColor,
              }}
            >
              {eyebrow}
            </span>
          )}

          <h2 className="mt-5 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">
            {title}
          </h2>

          <p className="mt-4 text-base leading-relaxed text-neutral-500">
            {desc}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="rounded-3xl border border-neutral-200 bg-white p-7 shadow-[0_18px_55px_rgba(0,0,0,0.06)]"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {points.map((point) => (
              <div key={point} className="flex gap-3">
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: accentBg, color: accentColor }}
                >
                  <FiCheckCircle size={15} />
                </span>

                <p className="text-sm font-semibold leading-relaxed text-neutral-700">
                  {point}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
