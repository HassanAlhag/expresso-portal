import React from "react";
import { motion } from "framer-motion";
import { FiArrowUpRight } from "react-icons/fi";
import { Link } from "react-router-dom";

const BRAND = "#7F8AD1";

const RevealCards = () => {
  return (
    <section className="bg-white px-4 py-12 md:py-16">
      {/* Section header (optional) */}

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2">
        <Card
          title="Website & App Development"
          description="High-performing, conversion-first websites and apps built to look premium and load fast."
          imgSrc="/88.jpg"
          link="/service/web-dev"
          tag="WEB"
        />
        <Card
          title="Social Media Management"
          description="Scroll-stopping content systems + campaigns that turn attention into real customers."
          imgSrc="/87.jpg"
          link="/service/social-media-marketing"
          tag="SOCIAL"
        />
        <Card
          title="SEO"
          description="Rank higher, get discovered, and attract qualified organic traffic that actually converts."
          imgSrc="/85.jpg"
          link="/service/seo-marketing"
          tag="SEO"
        />
        <Card
          title="Google Ads"
          description="Performance-first ads with measurable ROI — high intent traffic, better leads, smarter spend."
          imgSrc="/86.jpg"
          link="/service/google-ads"
          tag="ADS"
        />
      </div>
    </section>
  );
};

const Card = ({ imgSrc, title, description, link, tag }) => {
  return (
    <motion.article
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="group relative overflow-hidden rounded-[28px] border border-neutral-200 bg-neutral-950 shadow-[0_22px_70px_rgba(0,0,0,0.14)]"
    >
      {/* whole card clickable */}
      <Link to={link} className="absolute inset-0 z-30" aria-label={title} />

      {/* IMAGE */}
      <div className="relative aspect-[16/10] w-full">
        <img
          src={imgSrc}
          alt={title}
          loading="lazy"
          draggable={false}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.10]"
        />

        {/* cinematic overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/70 transition duration-300 group-hover:via-black/35 group-hover:to-black/80" />
        <div className="absolute inset-0 [background:radial-gradient(ellipse_at_top_left,rgba(127,138,209,0.28),transparent_55%)] opacity-0 transition duration-500 group-hover:opacity-100" />

        {/* premium border glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
          style={{
            boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 0 0 2px rgba(127,138,209,0.18)`,
          }}
        />

        {/* top tag */}
        <div className="absolute left-5 top-5 z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.22em] text-white/85 backdrop-blur-xl">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: BRAND }}
            />
            {tag}
          </span>
        </div>

        {/* CONTENT */}
        <div className="absolute inset-x-0 bottom-0 z-20 p-6">
          {/* stronger scrim behind text */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/90 via-black/55 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 backdrop-blur-[1px]" />

          {/* title always readable */}
          <h3
            className="relative z-10 text-2xl font-black tracking-tight text-white md:text-[28px]"
            style={{ textShadow: "0 10px 30px rgba(0,0,0,0.75)" }}
          >
            {title}
          </h3>

          {/* hover reveal */}
          <div className="relative z-10 mt-3 translate-y-6 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="max-w-[46ch] text-sm leading-relaxed text-white/80 md:text-base line-clamp-2">
              {description}
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl transition group-hover:bg-white/15">
              View details <FiArrowUpRight />
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default RevealCards;
