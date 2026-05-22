import React from "react";
import { motion } from "framer-motion";
import HomeSection from "../HomeSection/HomeSection";
import { BRAND } from "../../data/technologyConstants";
import { toWebsiteImageUrl } from "../../utils/websiteImages";

export default function SolutionImageCardsBlock({
  eyebrow,
  title,
  highlight,
  subtitle,
  items = [],
  accentColor = BRAND,
}) {
  return (
    <HomeSection
      eyebrow={eyebrow}
      title={title}
      highlight={highlight}
      subtitle={subtitle}
      align="center"
    >
      <div className="grid gap-5 md:grid-cols-3">
        {items.map((item, index) => (
          <motion.article
            key={`${item.title}-${index}`}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: index * 0.06 }}
            className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_14px_45px_rgba(0,0,0,0.05)] transition hover:-translate-y-1 hover:border-neutral-300 hover:shadow-[0_20px_55px_rgba(0,0,0,0.08)]"
          >
            {item.imageUrl ? (
              <img
                src={toWebsiteImageUrl(item.imageUrl)}
                alt={item.title || ""}
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
            ) : null}

            <div className="p-5">
              <span
                className="text-[11px] font-black uppercase tracking-[0.18em]"
                style={{ color: accentColor }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 text-[15px] font-bold text-neutral-950">
                {item.title}
              </h3>
              {item.desc ? (
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                  {item.desc}
                </p>
              ) : null}
            </div>
          </motion.article>
        ))}
      </div>
    </HomeSection>
  );
}
