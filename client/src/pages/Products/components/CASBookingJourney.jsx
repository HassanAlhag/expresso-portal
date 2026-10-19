import React from "react";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import HomeSection from "../../../components/HomeSection/HomeSection";
import { CAS_BOOKING_JOURNEY, CAS_IMAGES } from "../../../data/casProduct";

const ACCENT = "#7F8AD1";
const ACCENT_BG = "rgba(127,138,209,0.10)";

export default function CASBookingJourney() {
  const { bookingSlots, bookingConfirmed } = CAS_IMAGES;

  return (
    <HomeSection
      eyebrow={CAS_BOOKING_JOURNEY.eyebrow}
      title={CAS_BOOKING_JOURNEY.title}
      highlight={CAS_BOOKING_JOURNEY.highlight}
      subtitle={CAS_BOOKING_JOURNEY.subtitle}
    >
      <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
        <motion.img
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          src={bookingSlots.src}
          width={bookingSlots.width}
          height={bookingSlots.height}
          alt={bookingSlots.alt}
          loading="lazy"
          className="w-full rounded-2xl border border-neutral-200 object-cover object-top shadow-[0_18px_55px_rgba(0,0,0,0.10)]"
          style={{ aspectRatio: `${bookingSlots.width} / ${bookingSlots.height}` }}
        />

        <div className="flex justify-center lg:rotate-0">
          <span
            className="flex h-11 w-11 flex-shrink-0 rotate-90 items-center justify-center rounded-full lg:rotate-0"
            style={{ backgroundColor: ACCENT_BG, color: ACCENT }}
          >
            <FiArrowRight size={18} />
          </span>
        </div>

        <motion.img
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.08 }}
          src={bookingConfirmed.src}
          width={bookingConfirmed.width}
          height={bookingConfirmed.height}
          alt={bookingConfirmed.alt}
          loading="lazy"
          className="w-full rounded-2xl border border-neutral-200 object-cover object-top shadow-[0_18px_55px_rgba(0,0,0,0.10)]"
          style={{ aspectRatio: `${bookingConfirmed.width} / ${bookingConfirmed.height}` }}
        />
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
        {CAS_BOOKING_JOURNEY.steps.map((step, index) => (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: index * 0.06 }}
            className="flex items-start gap-3"
          >
            <span
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-black"
              style={{ backgroundColor: ACCENT_BG, color: ACCENT }}
            >
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-bold text-neutral-900">{step.label}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">
                {step.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </HomeSection>
  );
}
