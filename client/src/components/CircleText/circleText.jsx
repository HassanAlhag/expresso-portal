import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export const DrawCircleText = () => {
  const navigate = useNavigate();
  return (
    <div className="grid place-content-center px-4 py-20 text-black">
      <h1 className="max-w-2xl text-center text-5xl leading-snug">
        Empower Your{" "}
        <span className="relative">
          Marketing
          <svg
            viewBox="0 0 286 73"
            fill="none"
            className="absolute -left-2 -right-2 -top-2 bottom-0 translate-y-1"
          >
            <motion.path
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              transition={{
                duration: 1.25,
                ease: "easeInOut",
              }}
              d="M142.293 1C106.854 16.8908 6.08202 7.17705 1.23654 43.3756C-2.10604 68.3466 29.5633 73.2652 122.688 71.7518C215.814 70.2384 316.298 70.689 275.761 38.0785C230.14 1.37835 97.0503 24.4575 52.9384 1"
              stroke="#838FC6"
              strokeWidth="3"
            />
          </svg>
        </span>{" "}
        Journey with Expresso
      </h1>
      <div className="flex justify-center items-center mt-8">
        <div className="group relative w-fit transition-transform duration-300 active:scale-95">
          <button
            onClick={() => navigate("/contact-us")}
            className="relative z-10 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 p-0.5 duration-300 group-hover:scale-110"
          >
            <span className="block rounded-md bg-slate-950 px-4 py-2 font-semibold text-slate-100 duration-300 group-hover:bg-slate-950/50 group-hover:text-slate-50 group-active:bg-slate-950/80">
              Get Started
            </span>
          </button>
          <span className="pointer-events-none absolute -inset-4 z-0 transform-gpu rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 opacity-30 blur-xl transition-all duration-300 group-hover:opacity-90 group-active:opacity-50" />
        </div>
      </div>
    </div>
  );
};
