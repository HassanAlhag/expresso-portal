import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheckCircle, FiXSquare } from "react-icons/fi";

export const NeuPricing = ({ heading, pricingOptions }) => {
  return (
    <div>
      <section className="mx-auto max-w-7xl px-2 py-12 md:px-4">
        <h2 className="mx-auto mb-4 max-w-4xl text-center text-4xl font-bold leading-[1.15] md:text-6xl md:leading-[1.15]">
          {heading}
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-6 lg:mt-12 lg:grid-cols-3 lg:gap-8">
          {pricingOptions.map((option) => (
            <PriceColumn key={option.title} {...option} />
          ))}
        </div>
      </section>
    </div>
  );
};

const PriceColumn = ({ highlight, title, price, statement, items }) => {
  return (
    <div
      style={{
        boxShadow: highlight ? "0px 6px 0px rgb(24, 24, 27)" : "",
      }}
      className={`relative w-full rounded-lg p-6 md:p-8 ${
        highlight ? "border-2 border-zinc-900 bg-white" : ""
      }`}
    >
      {highlight && (
        <span className="absolute right-4 top-0 -translate-y-1/2 rounded-full bg-[#838FC6] px-2 py-0.5 text-sm text-white">
          Most Popular
        </span>
      )}

      <p className="mb-6 text-xl font-medium">{title}</p>
      <div className="mb-6 flex items-center gap-3">
        <AnimatePresence mode="popLayout">
          <motion.span
            initial={{
              y: 24,
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
            }}
            exit={{
              y: -24,
              opacity: 0,
            }}
            key={price}
            transition={{
              duration: 0.25,
              ease: "easeInOut",
            }}
            className="block text-6xl font-bold"
          >
            {price}
          </motion.span>
        </AnimatePresence>
        <motion.div layout className="font-medium text-zinc-600">
          <span className="block">aed</span>
        </motion.div>
      </div>

      <p className="mb-8 text-lg">{statement}</p>

      <div className="mb-8 space-y-2">
        {items.map((i) => (
          <CheckListItem key={i.children} checked={i.checked}>
            {i.children}
          </CheckListItem>
        ))}
      </div>

      <button
        className={`w-full rounded-lg p-3 text-base uppercase text-white transition-colors ${
          highlight
            ? "bg-[#838FC6] hover:bg-indigo-700"
            : "bg-zinc-900 hover:bg-zinc-700"
        }`}
      >
        Try it now
      </button>
    </div>
  );
};

const CheckListItem = ({ children, checked }) => {
  return (
    <div className="flex items-center gap-2 text-lg">
      {checked ? (
        <FiCheckCircle className="text-xl text-indigo-600" />
      ) : (
        <FiXSquare className="text-xl text-zinc-400" />
      )}
      {children}
    </div>
  );
};
