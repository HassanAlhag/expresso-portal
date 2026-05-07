import React from "react";
import { motion } from "framer-motion";
import HomeSection from "../HomeSection/HomeSection";
import { WHY_US } from "../../data/technologySolutionsData";

function WhyCard({ Icon, title, desc, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
        <Icon size={18} />
      </span>

      <h3 className="mt-4 text-[15px] font-bold text-white">{title}</h3>

      <p className="mt-2 text-sm leading-relaxed text-white/55">{desc}</p>
    </motion.div>
  );
}

export default function WhyExpressoGrid() {
  return (
    <HomeSection
      eyebrow="Why Expresso"
      title="Procurement you can"
      highlight="trust"
      subtitle="We built our procurement practice on transparency, technical depth, and long-term client relationships."
      theme="dark"
      className="bg-neutral-950"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {WHY_US.map((item, index) => (
          <WhyCard key={item.title} {...item} index={index} />
        ))}
      </div>
    </HomeSection>
  );
}
