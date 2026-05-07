import React from "react";
import { AiFillSchedule } from "react-icons/ai";
import { SiAdguard } from "react-icons/si";
import { BsCloudCheckFill } from "react-icons/bs";

const BRAND = "#7F8AD1";

const AboutUsSection = () => {
  return (
    <section className="relative bg-white">
      <div className="mx-auto w-[min(1200px,92vw)] py-12 sm:py-14">
        {/* ONE GRID from the start */}
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
          {/* LEFT */}
          <div className="lg:col-span-7">
            <p
              className="text-xs font-semibold tracking-[0.22em] uppercase"
              style={{ color: BRAND }}
            >
              About Expresso
            </p>

            <h1 className="mt-3 text-balance text-[clamp(32px,4.2vw,56px)] font-semibold leading-[1.05] tracking-tight text-neutral-950">
              Our Story — Expresso Digital Agency
            </h1>

            <p className="mt-5 text-pretty text-base leading-relaxed text-neutral-600 sm:text-lg">
              Expresso Digital Agency is a dynamic extension of Expresso Telecom
              Group (UAE / DIFC) bringing cutting-edge digital solutions to
              businesses across the Middle East & Africa—rooted in innovation
              and backed by a legacy of telecom excellence.
            </p>

            <div className="mt-8 space-y-5 text-neutral-600">
              <p className="text-base leading-relaxed sm:text-lg">
                We bridge the gap between creativity and technology to help
                brands thrive in the digital era.
              </p>

              <p className="text-base leading-relaxed sm:text-lg">
                Operating from our regional hubs — the Expresso Telecom head
                office in Dubai Financial Center and our Digital Agency office
                in Al Garhoud — we are committed to delivering full-spectrum
                digital marketing services tailored to the unique needs of each
                market.
              </p>

              <div className="pt-2">
                <div className="h-px w-24 bg-neutral-200" />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MiniTag title="UAE / DIFC presence" />
                <MiniTag title="Middle East & Africa" />
                <MiniTag title="Telecom-backed legacy" />
                <MiniTag title="Full-spectrum digital" />
              </div>
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-50 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
              {/* enforce a consistent ratio so it aligns and fills */}
              <div className="aspect-[3/4] w-full lg:aspect-[4/5] lg:h-[520px] xl:h-[590px]">
                <img
                  src="https://demo.casethemes.net/saira/wp-content/uploads/2023/07/banner-3.png"
                  alt="Team Working"
                  className="h-full w-full object-cover"
                />
              </div>

              <div
                className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full blur-3xl opacity-30"
                style={{ background: BRAND }}
              />

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent p-5">
                <p className="text-sm font-medium text-white/90">
                  Strategy + Creative + Performance — under one roof.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURES */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Feature
            icon={<AiFillSchedule size={22} />}
            title="Empowering Growth"
            desc="We build strategies that scale with your business — not just short-term wins."
          />
          <Feature
            icon={<BsCloudCheckFill size={22} />}
            title="Customer-Centric"
            desc="Clear communication, fast execution, and outcomes aligned with your goals."
          />
          <Feature
            icon={<SiAdguard size={22} />}
            title="Excellence Always"
            desc="Quality control at every step — design, content, campaigns, and delivery."
          />
        </div>
      </div>
    </section>
  );
};

const MiniTag = ({ title }) => (
  <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-800 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
    {title}
  </div>
);

const Feature = ({ icon, title, desc }) => (
  <div className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_14px_40px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(0,0,0,0.10)]">
    <div className="flex items-start gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-2xl border border-neutral-200 bg-neutral-50 text-neutral-900">
        {icon}
      </div>
      <div>
        <h4 className="text-base font-semibold text-neutral-950">{title}</h4>
        <p className="mt-1 text-sm leading-relaxed text-neutral-600">{desc}</p>
      </div>
    </div>
  </div>
);

export default AboutUsSection;
