import React from "react";
import { motion } from "framer-motion";

const WebDevelopmentSolutions = ({ 
  image, 
  heading, 
  descriptions 
}) => {
  return (
    <motion.div
      className="flex flex-col md:flex-row items-start justify-center px-6 py-8 bg-cover bg-center text-white gap-14 max-w-[1270px] mx-auto mt-10"
      style={{
        backgroundImage: "url('https://demo.casethemes.net/saira/wp-content/uploads/2023/09/u-bg6.jpg')",
      }}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="w-full md:w-1/2 flex justify-center">
        <img
          src={image}
          alt={heading}
          className="h-auto w-full md:w-auto object-cover"
        />
      </div>

      <div className="w-full md:w-1/2 flex flex-col items-center md:items-center text-center md:text-left">
        <h2 className="text-4xl md:text-5xl font-bold text-black">
          {heading}
        </h2>
        {descriptions.map((description, index) => (
          <p 
            key={index} 
            className="mt-4 leading-relaxed max-w-3xl text-lg md:text-xl text-gray-700"
          >
            {description}
          </p>
        ))}
      </div>
    </motion.div>
  );
};

export default WebDevelopmentSolutions;
