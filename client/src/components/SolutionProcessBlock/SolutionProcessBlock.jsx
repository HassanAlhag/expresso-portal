import React from "react";
import { motion } from "framer-motion";
import HomeSection from "../HomeSection/HomeSection";
import { BRAND, BRAND_BG } from "../../data/technologySolutionsData";

export default function SolutionProcessBlock({
  eyebrow,
  title,
  subtitle = "A structured and transparent process designed to reduce risk and keep delivery clear.",
  steps = [],
  accentColor = BRAND,
  accentBg = BRAND_BG,
}) {
  return (
    <HomeSection eyebrow={eyebrow} title={title} subtitle={subtitle}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((item, index) => (
          <motion.div
            key={item.step}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: index * 0.06 }}
            className="rounded-2xl border border-neutral-200 bg-white p-5"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-black"
              style={{ backgroundColor: accentBg, color: accentColor }}
            >
              {item.step}
            </span>

            <h3 className="mt-4 text-[14px] font-bold text-neutral-900">
              {item.title}
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
              {item.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </HomeSection>
  );
}
