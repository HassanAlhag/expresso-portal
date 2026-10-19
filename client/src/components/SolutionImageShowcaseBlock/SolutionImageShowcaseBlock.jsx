import React from "react";
import { motion } from "framer-motion";
import { FiCheckCircle } from "react-icons/fi";
import { BRAND, BRAND_BG } from "../../data/technologyConstants";
import { toWebsiteImageUrl } from "../../utils/websiteImages";

export default function SolutionImageShowcaseBlock({
  eyebrow,
  title,
  desc,
  imageUrl,
  imageAlt,
  secondaryImageUrl,
  secondaryImageAlt,
  points = [],
  accentColor = BRAND,
  accentBg = BRAND_BG,
}) {
  return (
    <section className="bg-neutral-50 py-20">
      <div className="mx-auto grid w-[min(1200px,92vw)] gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className={`grid gap-4 ${secondaryImageUrl ? "sm:grid-cols-[1fr_0.62fr]" : ""}`}
        >
          {imageUrl ? (
            <img
              src={toWebsiteImageUrl(imageUrl)}
              alt={imageAlt ?? title ?? ""}
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
              loading="lazy"
            />
          ) : null}
          {secondaryImageUrl ? (
            <img
              src={toWebsiteImageUrl(secondaryImageUrl)}
              alt={secondaryImageAlt ?? ""}
              className="aspect-[4/5] w-full rounded-2xl object-cover shadow-[0_18px_50px_rgba(0,0,0,0.10)] sm:mt-12"
              loading="lazy"
            />
          ) : null}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          {eyebrow ? (
            <span
              className="inline-block rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest"
              style={{
                borderColor: accentColor,
                backgroundColor: accentBg,
                color: accentColor,
              }}
            >
              {eyebrow}
            </span>
          ) : null}

          <h2 className="mt-5 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">
            {title}
          </h2>

          {desc ? (
            <p className="mt-4 text-base leading-relaxed text-neutral-500">
              {desc}
            </p>
          ) : null}

          {points.length > 0 ? (
            <div className="mt-6 grid gap-3">
              {points.map((point) => (
                <div key={point} className="flex gap-3">
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: accentBg, color: accentColor }}
                  >
                    <FiCheckCircle size={15} />
                  </span>
                  <p className="text-sm font-semibold leading-relaxed text-neutral-700">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
