import React from "react";
import { motion } from "framer-motion";
import HomeSection from "../../../components/HomeSection/HomeSection";
import { CAS_BUILT_BY } from "../../../data/casProduct";

export default function CASBuiltBy() {
  const { eyebrow, title, highlight, description, capabilities } = CAS_BUILT_BY;

  return (
    <HomeSection eyebrow={eyebrow} title={title} highlight={highlight}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-2xl text-center"
      >
        <p className="text-base leading-relaxed text-neutral-500">
          {description}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          {capabilities.map((item) => (
            <span
              key={item}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold text-neutral-700"
            >
              {item}
            </span>
          ))}
        </div>
      </motion.div>
    </HomeSection>
  );
}
