import React from "react";
import { motion } from "framer-motion";
import { FiCheck } from "react-icons/fi";
import HomeSection from "../../../components/HomeSection/HomeSection";
import { CAS_PLATFORM_SUMMARY } from "../../../data/casProduct";

const ACCENT = "#7F8AD1";
const ACCENT_BG = "rgba(127,138,209,0.10)";

function SummaryCard({ title, items, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8"
    >
      <h3 className="text-lg font-bold text-neutral-950">{title}</h3>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-3">
            <span
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: ACCENT_BG, color: ACCENT }}
            >
              <FiCheck size={13} />
            </span>
            <span className="text-sm font-semibold text-neutral-700">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function CASPlatformSummary() {
  const { eyebrow, title, highlight, patient, clinic } = CAS_PLATFORM_SUMMARY;

  return (
    <HomeSection eyebrow={eyebrow} title={title} highlight={highlight}>
      <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
        <SummaryCard title={patient.title} items={patient.items} delay={0} />
        <SummaryCard title={clinic.title} items={clinic.items} delay={0.08} />
      </div>
    </HomeSection>
  );
}
