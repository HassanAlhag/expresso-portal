import React from "react";
import { FiCompass, FiCode, FiZap } from "react-icons/fi";

const BRAND = "#838FC6";

const WorkflowSection = () => {
  const steps = [
    {
      step: "01",
      title: "DISCOVERY & STRATEGY",
      desc: "We align on goals, audience, offer, and the customer journey—then turn it into a clear plan with priorities and timelines.",
      icon: FiCompass,
    },
    {
      step: "02",
      title: "DESIGN & DEVELOPMENT",
      desc: "Conversion-first UI/UX, clean scalable code, and performance optimizations—built to look premium and load fast.",
      icon: FiCode,
    },
    {
      step: "03",
      title: "LAUNCH & OPTIMIZE",
      desc: "Smooth deployment, tracking setup, QA, and post-launch improvements—so results keep getting better over time.",
      icon: FiZap,
    },
  ];

  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-gray-200 pb-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-neutral-500">
              PROCESS
            </p>
            <h2 className="mt-3 text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-neutral-950">
              SEAMLESS <br /> WORKFLOW
            </h2>
          </div>

          <p className="text-neutral-600 max-w-md mt-6 md:mt-0 text-sm leading-relaxed">
            A simple, high-clarity process designed to reduce back-and-forth,
            speed up delivery, and keep your project aligned with business
            goals.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s) => {
            const Icon = s.icon;

            return (
              <div
                key={s.step}
                className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-7 shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_55px_rgba(0,0,0,0.10)]"
              >
                {/* soft brand glow */}
                <div
                  className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full blur-3xl opacity-0 transition duration-500 group-hover:opacity-35"
                  style={{ background: BRAND }}
                />
                <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100 bg-[radial-gradient(900px_circle_at_20%_0%,rgba(131,143,198,0.18),transparent_55%)]" />

                {/* top row */}
                <div className="relative flex items-start justify-between gap-4">
                  {/* step pill */}
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-bold"
                      style={{
                        background: "rgba(131,143,198,0.16)",
                        color: BRAND,
                      }}
                    >
                      STEP {s.step}
                    </span>

                    <span className="h-[1px] w-10 bg-neutral-200" />
                  </div>

                  {/* icon */}
                  <div
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white shadow-sm transition group-hover:border-transparent"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(131,143,198,0.18), rgba(131,143,198,0.04))",
                    }}
                  >
                    <Icon
                      className="text-[20px]"
                      style={{ color: BRAND }}
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <h3 className="relative mt-6 text-lg font-extrabold tracking-tight text-neutral-950">
                  {s.title}
                </h3>

                <p className="relative mt-3 text-sm leading-relaxed text-neutral-600">
                  {s.desc}
                </p>

                <div className="relative mt-6 flex items-center gap-3">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: BRAND }}
                  />
                  <div className="h-px flex-1 bg-neutral-200 transition group-hover:bg-neutral-300" />
                  <span className="text-xs font-semibold text-neutral-500">
                    Expresso Digital
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-neutral-200 bg-neutral-50 px-7 py-6">
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              Want a clear timeline + deliverables?
            </p>
            <p className="text-sm text-neutral-600">
              We’ll share a simple plan with milestones and what we need from
              you.
            </p>
          </div>

          <a
            href="#lead-form"
            className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-extrabold text-white transition hover:brightness-110"
            style={{ background: BRAND }}
          >
            Get my proposal →
          </a>
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;
