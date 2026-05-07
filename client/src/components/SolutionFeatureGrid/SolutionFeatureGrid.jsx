import React from "react";
import { motion } from "framer-motion";
import { FiCheckCircle } from "react-icons/fi";
import HomeSection from "../HomeSection/HomeSection";
import { BRAND, BRAND_BG } from "../../data/technologySolutionsData";

export default function SolutionFeatureGrid({
  eyebrow,
  title,
  highlight,
  subtitle,
  items = [],
  accentColor = BRAND,
  accentBg = BRAND_BG,
}) {
  return (
    <HomeSection
      eyebrow={eyebrow}
      title={title}
      highlight={highlight}
      subtitle={subtitle}
      align="center"
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: (index % 3) * 0.06 }}
            className="rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-300 hover:shadow-[0_16px_45px_rgba(0,0,0,0.07)]"
          >
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: accentBg, color: accentColor }}
            >
              <FiCheckCircle size={18} />
            </span>

            <h3 className="mt-4 text-[15px] font-bold text-neutral-900">
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
