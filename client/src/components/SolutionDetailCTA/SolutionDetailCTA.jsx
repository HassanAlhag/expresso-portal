import React from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";

export default function SolutionDetailCTA({ solution }) {
  const navigate = useNavigate();

  return (
    <section
      className="relative overflow-hidden py-24"
      style={{
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
      }}
    >
      <div className="relative mx-auto w-[min(1100px,92vw)] text-center">
        <span className="inline-block rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-indigo-300">
          Need Guidance?
        </span>

        <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Interested in {solution.title}?
          <br />
          Talk to our <span className="text-indigo-300">technology team.</span>
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/55">
          We can help you compare options, define requirements, and choose the
          right approach before you commit.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() =>
              navigate(
                `/contact-us?solution=${encodeURIComponent(solution.title)}`
              )
            }
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-8 py-3.5 text-sm font-bold text-white transition hover:opacity-90"
          >
            Talk to an expert
            <FiArrowRight size={15} />
          </button>

          <button
            onClick={() => navigate("/it-solutions")}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-8 py-3.5 text-sm font-bold text-white/80 transition hover:border-white/30 hover:text-white"
          >
            Back to all solutions
          </button>
        </div>
      </div>
    </section>
  );
}
