import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowRight, FiPackage } from "react-icons/fi";
import { BRAND, BRAND_BG, ICON_META } from "../../data/technologySolutionsData";

export default function SolutionCard({
  icon,
  title,
  subtitle,
  description,
  slug,
  to,
  index = 0,
}) {
  const navigate = useNavigate();

  const meta = ICON_META[icon] || {
    Icon: FiPackage,
    color: BRAND,
    bg: BRAND_BG,
  };

  const { Icon } = meta;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: (index % 4) * 0.06 }}
      className="group relative flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.09)]"
    >
      <span
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl transition group-hover:scale-105"
        style={{ backgroundColor: meta.bg, color: meta.color }}
      >
        <Icon size={20} />
      </span>

      <h3 className="mt-4 text-[15px] font-bold text-neutral-900">{title}</h3>

      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-neutral-500">
        {subtitle}
      </p>

      {description && (
        <p className="mt-2 text-xs leading-relaxed text-neutral-400">
          {description}
        </p>
      )}

      <button
        onClick={() => navigate(to || `/it-solutions/${slug}`)}
        className="mt-5 inline-flex items-center gap-1 text-xs font-bold transition"
        style={{ color: meta.color }}
      >
        Explore solution
        <FiArrowRight
          size={11}
          className="transition group-hover:translate-x-0.5"
        />
      </button>
    </motion.div>
  );
}
