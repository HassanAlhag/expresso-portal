import React from "react";
import { motion } from "framer-motion";

const PricingFeaturesGrid = ({ features }) => {
  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            className="flex gap-14 p-4 rounded-lg shadow-md bg-white transition-transform cursor-pointer"
            whileHover={{ scale: 1.05, rotate: 1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="flex-shrink-0 flex items-center">
              <motion.div whileHover={{ rotate: 15 }} className="transition-transform">
                {feature.icon}
              </motion.div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{feature.title}</h3>
              <p className="mt-2 text-gray-600">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PricingFeaturesGrid;
