import React from "react";
import { AiFillSchedule } from "react-icons/ai";
import { SiAdguard } from "react-icons/si";
import { BsCloudCheckFill } from "react-icons/bs";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImage } from "../../utils/websiteImages";

const BRAND = "#7F8AD1";

const DEFAULT_PARAGRAPHS = [
  "Expresso Digital Agency is a dynamic extension of Expresso Telecom Group (UAE / DIFC) bringing cutting-edge digital solutions to businesses across the Middle East & Africa—rooted in innovation and backed by a legacy of telecom excellence.",
  "We bridge the gap between creativity and technology to help brands thrive in the digital era.",
  "Operating from our regional hubs — the Expresso Telecom head office in Dubai Financial Center and our Digital Agency office in Al Garhoud — we are committed to delivering full-spectrum digital marketing services tailored to the unique needs of each market.",
];

const DEFAULT_TAGS = [
  "UAE / DIFC presence",
  "Middle East & Africa",
  "Telecom-backed legacy",
  "Full-spectrum digital",
];

const DEFAULT_FEATURES = [
  {
    icon: <AiFillSchedule size={22} />,
    title: "Empowering Growth",
    desc: "We build strategies that scale with your business — not just short-term wins.",
  },
  {
    icon: <BsCloudCheckFill size={22} />,
    title: "Customer-Centric",
    desc: "Clear communication, fast execution, and outcomes aligned with your goals.",
  },
  {
    icon: <SiAdguard size={22} />,
    title: "Excellence Always",
    desc: "Quality control at every step — design, content, campaigns, and delivery.",
  },
];

const AboutUsSection = ({
  imageUrl = "/about.webp",
  subheading = "About Expresso",
  heading = "Our Story — Expresso Digital Agency",
  paragraphs = DEFAULT_PARAGRAPHS,
  tags = DEFAULT_TAGS,
  features = DEFAULT_FEATURES,
  bottomCaption = "Strategy + Creative + Performance — under one roof.",
}) => {
  const settings = useSiteSettings();
  const resolvedImageUrl = resolveWebsiteImage(settings, imageUrl);

  return (
    <section id="our-story" className="relative bg-white">
      <div className="mx-auto w-[min(1200px,92vw)] py-12 sm:py-14">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
          {/* LEFT */}
          <div className="lg:col-span-7">
            <p
              className="text-xs font-semibold tracking-[0.22em] uppercase"
              style={{ color: BRAND }}
            >
              {subheading}
            </p>

            <h1 className="mt-3 text-balance text-[clamp(32px,4.2vw,56px)] font-semibold leading-[1.05] tracking-tight text-neutral-950">
              {heading}
            </h1>

            {paragraphs.slice(0, 1).map((p, i) => (
              <p key={i} className="mt-5 text-pretty text-base leading-relaxed text-neutral-600 sm:text-lg">
                {p}
              </p>
            ))}

            <div className="mt-8 space-y-5 text-neutral-600">
              {paragraphs.slice(1).map((p, i) => (
                <p key={i} className="text-base leading-relaxed sm:text-lg">
                  {p}
                </p>
              ))}

              <div className="pt-2">
                <div className="h-px w-24 bg-neutral-200" />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {tags.map((tag, i) => (
                  <MiniTag key={i} title={tag} />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-50 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
              <div className="aspect-[3/4] w-full lg:aspect-[4/5] lg:h-[520px] xl:h-[590px]">
                <img
                  src={resolvedImageUrl}
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
                  {bottomCaption}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURES */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {features.map((f, i) => (
            <Feature key={i} icon={f.icon} title={f.title} desc={f.desc} />
          ))}
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
      {icon ? (
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-neutral-200 bg-neutral-50 text-neutral-900">
          {icon}
        </div>
      ) : null}
      <div>
        <h4 className="text-base font-semibold text-neutral-950">{title}</h4>
        <p className="mt-1 text-sm leading-relaxed text-neutral-600">{desc}</p>
      </div>
    </div>
  </div>
);

export default AboutUsSection;
