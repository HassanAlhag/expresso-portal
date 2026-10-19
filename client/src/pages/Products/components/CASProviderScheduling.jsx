import React from "react";
import { motion } from "framer-motion";
import HomeSection from "../../../components/HomeSection/HomeSection";
import { CAS_PROVIDER_SCHEDULING, CAS_IMAGES } from "../../../data/casProduct";

export default function CASProviderScheduling() {
  const { eyebrow, title, highlight, subtitle } = CAS_PROVIDER_SCHEDULING;
  const { adminSchedule } = CAS_IMAGES;

  return (
    <HomeSection
      eyebrow={eyebrow}
      title={title}
      highlight={highlight}
      subtitle={subtitle}
    >
      <motion.img
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
        src={adminSchedule.src}
        width={adminSchedule.width}
        height={adminSchedule.height}
        alt={adminSchedule.alt}
        loading="lazy"
        className="mx-auto w-full max-w-5xl rounded-2xl border border-neutral-200 object-cover object-top shadow-[0_24px_70px_rgba(0,0,0,0.12)]"
        style={{ aspectRatio: `${adminSchedule.width} / ${adminSchedule.height}` }}
      />
    </HomeSection>
  );
}
