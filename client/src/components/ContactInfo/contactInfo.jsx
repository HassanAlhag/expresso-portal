// src/components/ContactInfo/contactInfo.jsx
import React from "react";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaGlobe,
} from "react-icons/fa";

const BRAND = "#7F8AD1";

const ContactInfoSection = () => {
  return (
    <section className="relative bg-white px-6 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl">
        {/* Cards ONLY (header removed for no duplication) */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard
            icon={<FaPhoneAlt />}
            title="Call Us Now"
            highlight="+971 56 683 5517"
            desc="Get a quick consultation on websites, pricing, and growth strategy."
            cta="Call Now"
            href="tel:+971566835517"
          />
          <InfoCard
            icon={<FaGlobe />}
            title="Social Media"
            highlight="Expresso Digital Agency"
            desc="Follow us for updates, offers, and our latest work."
            cta="Connect Now"
            href="https://www.instagram.com/expresso.digitalagency/"
            targetBlank
          />
          <InfoCard
            icon={<FaEnvelope />}
            title="Email Address"
            highlight="info@expresso.ae"
            desc="Send your request and we’ll respond with the right next steps."
            cta="Send Email"
            href="mailto:info@expresso.ae"
          />
          <InfoCard
            icon={<FaMapMarkerAlt />}
            title="Location"
            highlight="Al Garhoud, Dubai"
            desc="Visit us to discuss your project in person."
            cta="Visit Us Now"
            href="https://www.google.com/maps/place/Expresso+Business+Solution+%2F+Etisalat+Premium+Channel+Partner/@25.2527835,55.3363042,17z/data=!3m1!4b1!4m6!3m5!1s0x3e5f5dac0817ed4b:0x1c488c67d297ab56!8m2!3d25.2527835!4d55.3388791!16s%2Fg%2F11h_y0wc4l?entry=ttu&g_ep=EgoyMDI1MDUxMi4wIKXMDSoASAFQAw%3D%3D"
            targetBlank
          />
        </div>
      </div>
    </section>
  );
};

const InfoCard = ({ icon, title, highlight, desc, cta, href, targetBlank }) => {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_14px_40px_rgba(0,0,0,0.08)] transition hover:-translate-y-1 hover:shadow-[0_22px_70px_rgba(0,0,0,0.12)]">
      {/* soft brand glow */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl opacity-0 transition group-hover:opacity-100"
        style={{ backgroundColor: BRAND }}
      />

      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl border"
          style={{
            borderColor: "rgba(127,138,209,0.25)",
            backgroundColor: "rgba(127,138,209,0.10)",
            color: BRAND,
          }}
        >
          <span className="text-xl">{icon}</span>
        </div>

        <div className="min-w-0">
          <h2 className="text-lg font-bold text-neutral-950">{title}</h2>
          <p
            className="mt-1 truncate text-sm font-semibold"
            style={{ color: BRAND }}
            title={highlight}
          >
            {highlight}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-neutral-600">{desc}</p>

      <a
        href={href}
        target={targetBlank ? "_blank" : undefined}
        rel={targetBlank ? "noreferrer" : undefined}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-neutral-950 transition group-hover:translate-x-0.5"
      >
        <span style={{ color: BRAND }}>{cta}</span>
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 transition group-hover:border-neutral-300"
          aria-hidden="true"
        >
          &rarr;
        </span>
      </a>
    </div>
  );
};

export default ContactInfoSection;
