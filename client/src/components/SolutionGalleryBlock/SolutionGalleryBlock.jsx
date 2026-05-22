import React from "react";
import { motion } from "framer-motion";
import HomeSection from "../HomeSection/HomeSection";
import { toWebsiteImageUrl } from "../../utils/websiteImages";

export default function SolutionGalleryBlock({
  eyebrow,
  title,
  subtitle,
  items = [],
}) {
  return (
    <HomeSection
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      align="center"
      className="bg-white"
    >
      <div className="grid gap-4 md:grid-cols-4">
        {items.map((item, index) => (
          <motion.figure
            key={`${item.title}-${index}`}
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: index * 0.04 }}
            className={[
              "group overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950",
              index === 0 ? "md:col-span-2 md:row-span-2" : "",
            ].join(" ")}
          >
            {item.imageUrl ? (
              <img
                src={toWebsiteImageUrl(item.imageUrl)}
                alt={item.title || ""}
                className={[
                  "w-full object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100",
                  index === 0 ? "aspect-[4/3] md:h-full" : "aspect-[4/3]",
                ].join(" ")}
                loading="lazy"
              />
            ) : null}

            {(item.title || item.desc) ? (
              <figcaption className="bg-neutral-950 p-4 text-white">
                {item.title ? (
                  <p className="text-sm font-black">{item.title}</p>
                ) : null}
                {item.desc ? (
                  <p className="mt-1 text-xs leading-5 text-white/62">
                    {item.desc}
                  </p>
                ) : null}
              </figcaption>
            ) : null}
          </motion.figure>
        ))}
      </div>
    </HomeSection>
  );
}
