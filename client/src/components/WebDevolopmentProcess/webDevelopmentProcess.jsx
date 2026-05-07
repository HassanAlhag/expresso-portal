import React from "react";
import { motion } from "framer-motion";

const WebDevelopmentProcess = ({
  cards = [],
  backgroundColor = "bg-white",
  title,
  subtitle,
}) => {
  const cols =
    cards.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4";

  return (
    <section className={`${backgroundColor} py-10 md:py-14`}>
      <div className="mx-auto w-[min(1200px,92vw)]">
        {(title || subtitle) && (
          <div className="mb-10 text-center md:mb-14">
            {title ? (
              <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 md:text-4xl">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="mx-auto mt-3 max-w-2xl text-base text-neutral-600 md:text-lg">
                {subtitle}
              </p>
            ) : null}
          </div>
        )}

        <div className={`grid gap-6 md:gap-8 ${cols}`}>
          {cards.map((card, index) => (
            <Card key={index} {...card} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

const Card = ({ image, title, description, index }) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-5 shadow-[0_16px_50px_rgba(0,0,0,0.06)] transition hover:-translate-y-1 hover:shadow-[0_26px_80px_rgba(0,0,0,0.10)]"
    >
      {/* subtle glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl opacity-0 transition group-hover:opacity-100" />
      <div className="pointer-events-none absolute -left-28 -bottom-28 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl opacity-0 transition group-hover:opacity-100" />

      {/* image */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-black/0 via-white/0 to-white/25 opacity-0 transition group-hover:opacity-100" />
        <img
          src={image}
          alt={title}
          className="h-44 w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          loading="lazy"
          draggable={false}
        />
      </div>

      {/* content */}
      <div className="mt-5">
        <h4 className="text-lg font-semibold tracking-tight text-neutral-950">
          {title}
        </h4>

        <p className="mt-2 text-sm leading-relaxed text-neutral-600 line-clamp-3">
          {description}
        </p>

        {/* micro CTA */}
        <div className="mt-5 h-px w-full bg-neutral-200/70" />
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-semibold tracking-[0.18em] text-indigo-600">
            STEP {String(index + 1).padStart(2, "0")}
          </span>

          <span className="text-xs text-neutral-500 transition group-hover:text-neutral-700">
            Hover to preview
          </span>
        </div>
      </div>
    </motion.article>
  );
};

export default WebDevelopmentProcess;
