import React from "react";
import { motion } from "framer-motion";
import HomeSection from "../HomeSection/HomeSection";
import {
  BRAND,
  BRAND_BG,
  PROCESS_STEPS,
} from "../../data/technologySolutionsData";

export default function ProcurementProcess() {
  return (
    <HomeSection
      eyebrow="How It Works"
      title="Our procurement"
      highlight="process"
      subtitle="A structured, transparent process from your first call to post-deployment support."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROCESS_STEPS.map((item, index) => (
          <motion.div
            key={item.step}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: index * 0.07 }}
            className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-5"
          >
            <span
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-black"
              style={{ backgroundColor: BRAND_BG, color: BRAND }}
            >
              {item.step}
            </span>

            <div>
              <h3 className="text-[14px] font-bold text-neutral-900">
                {item.title}
              </h3>

              <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                {item.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </HomeSection>
  );
}
