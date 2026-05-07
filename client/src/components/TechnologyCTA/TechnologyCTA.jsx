import React from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { BRAND, BRAND_GLOW } from "../../data/technologySolutionsData";

export default function TechnologyCTA() {
  const navigate = useNavigate();

  return (
    <section
      className="relative overflow-hidden py-24"
      style={{
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl"
        style={{ backgroundColor: BRAND_GLOW }}
      />

      <div className="relative mx-auto w-[min(1200px,92vw)] text-center">
        <span
          className="inline-block rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest"
          style={{
            borderColor: "rgba(99,102,241,0.4)",
            backgroundColor: "rgba(99,102,241,0.1)",
            color: "#a5b4fc",
          }}
        >
          Start a Conversation
        </span>

        <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Tell us what you need.
          <br />
          We'll find the{" "}
          <span style={{ color: "#a5b4fc" }}>right solution.</span>
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/55">
          Whether you have a clear requirement or just a challenge to solve, our
          team is ready to scope, source, and deliver.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate("/contact-us")}
            className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold text-white transition hover:opacity-90 active:scale-95"
            style={{ backgroundColor: BRAND }}
          >
            Request a consultation
            <FiArrowRight size={15} />
          </button>

          <button
            onClick={() => navigate("/contact-us")}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-8 py-3.5 text-sm font-bold text-white/80 transition hover:border-white/30 hover:text-white"
          >
            Get a quote
          </button>
        </div>
      </div>
    </section>
  );
}
