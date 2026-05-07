import React from "react";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import HomeSection from "../HomeSection/HomeSection";
import { BRAND, BRAND_BG } from "../../data/technologySolutionsData";

export default function SolutionUseCasesBlock({
  eyebrow,
  title,
  subtitle = "Common scenarios where this solution can create value for your business.",
  items = [],
  accentColor = BRAND,
  accentBg = BRAND_BG,
}) {
  return (
    <HomeSection
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      align="center"
    >
      <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
        {items.map((item, index) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
            className="group flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-300"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: accentBg, color: accentColor }}
            >
              <FiArrowRight
                size={16}
                className="transition group-hover:translate-x-0.5"
              />
            </span>

            <p className="text-sm font-bold text-neutral-800">{item}</p>
          </motion.div>
        ))}
      </div>
    </HomeSection>
  );
}
