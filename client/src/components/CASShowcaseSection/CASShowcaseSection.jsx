import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import HomeSection from "../HomeSection/HomeSection";
import CASProductComposition from "./CASProductComposition";
import { CAS_PRODUCT } from "../../data/casProduct";

export default function CASShowcaseSection() {
  return (
    <HomeSection
      eyebrow={CAS_PRODUCT.eyebrow}
      title="Technology we build,"
      highlight="not just implement."
      align="center"
      className="border-y border-[rgba(127,138,209,0.10)] bg-[linear-gradient(180deg,rgba(127,138,209,0.035)_0%,rgba(127,138,209,0.015)_100%)]"
    >
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8"
        >
          <span className="inline-flex items-center rounded-full border border-[rgba(127,138,209,0.22)] bg-[rgba(127,138,209,0.07)] px-3 py-1 text-xs font-semibold tracking-wide text-[#5762b8]">
            {CAS_PRODUCT.badge}
          </span>

          <h3 className="mt-4 font-dax-compact text-2xl font-bold leading-snug text-neutral-950 sm:text-3xl">
            {CAS_PRODUCT.name}
            <span className="mt-1 block text-base font-semibold text-neutral-500 sm:text-lg">
              {CAS_PRODUCT.fullName}
            </span>
          </h3>

          <p className="mt-4 text-sm leading-relaxed text-neutral-500 sm:text-base">
            Patients discover doctors, check real availability, and book an
            appointment — while the clinic team manages doctors, schedules,
            and appointments from one admin console.
          </p>

          <Link
            to={CAS_PRODUCT.to}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#7F8AD1] px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110 active:scale-[0.98]"
          >
            {CAS_PRODUCT.ctaLabel}
            <FiArrowRight size={14} aria-hidden="true" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.08 }}
        >
          <CASProductComposition />
        </motion.div>
      </div>
    </HomeSection>
  );
}
