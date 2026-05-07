import React from "react";
import { FiArrowRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import SolutionCard from "../SolutionCard/SolutionCard";

export default function SolutionMegaPanel({ solutions = [] }) {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-neutral-950 py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_40%,rgba(99,102,241,0.18),transparent_35%)]" />

      <div className="relative mx-auto w-[min(1280px,92vw)]">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-[0_28px_90px_rgba(0,0,0,0.35)]">
          <div className="grid lg:grid-cols-[390px_1fr]">
            {/* Left dark panel */}
            <aside className="relative overflow-hidden bg-[#07070b] p-8 sm:p-10 lg:min-h-[520px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(99,102,241,0.18),transparent_42%)]" />

              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <span className="inline-flex rounded-full border border-indigo-400/35 bg-indigo-500/5 px-5 py-2 text-[11px] font-black uppercase tracking-[0.35em] text-indigo-300">
                    Technology Solutions
                  </span>

                  <h2 className="mt-8 max-w-[280px] text-3xl font-extrabold leading-tight tracking-tight text-white">
                    Enterprise technology built for scale.
                  </h2>

                  <p className="mt-7 max-w-[280px] text-base leading-relaxed text-white/45">
                    From ERP and CRM to IoT, cloud, and full data center
                    infrastructure.
                  </p>
                </div>

                <button
                  onClick={() => navigate("/contact-us")}
                  className="mt-10 inline-flex w-fit items-center gap-3 text-sm font-extrabold text-indigo-300 transition hover:text-white"
                >
                  Talk to an expert
                  <FiArrowRight size={17} />
                </button>
              </div>
            </aside>

            {/* Right grid */}
            <div className="bg-white p-8 sm:p-10 lg:p-14">
              <div className="grid gap-x-12 gap-y-12 sm:grid-cols-2 xl:grid-cols-4">
                {solutions.map((item, index) => (
                  <SolutionCard
                    key={item._id || item.title}
                    {...item}
                    index={index}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
