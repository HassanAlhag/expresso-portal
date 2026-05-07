import React from "react";
import {
  MonitorSmartphone,
  Megaphone,
  Search,
  PenTool,
  BarChart3,
  Clapperboard,
  ArrowUpRight,
} from "lucide-react";
import HomeSection from "../HomeSection/HomeSection";

const BRAND = "#7F8AD1";

export default function ServicesSection({ onPrimaryClick }) {
  return (
    <HomeSection
      eyebrow="SERVICES"
      title="Services built for"
      highlight="growth"
      subtitle="We combine design, content, SEO, paid media, and analytics to help brands grow with clarity and consistency."
      align="center"
    >
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="grid gap-4 lg:col-span-7">
          <ServiceCard
            title="Website Design & Development"
            text="Conversion-focused websites and landing pages built to look premium and perform fast."
            Icon={MonitorSmartphone}
            tone="brand"
            size="hero"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <ServiceCard
              title="SEO Optimization"
              text="Structure, content, and search visibility improvements that help quality traffic grow."
              Icon={Search}
              tone="light"
            />

            <ServiceCard
              title="Paid Ads & PPC"
              text="Performance campaigns designed to generate leads, sales, and measurable growth."
              Icon={Megaphone}
              tone="light"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-[1.15fr,0.85fr]">
            <ServiceCard
              title="Branding & Visual Direction"
              text="Sharper positioning, cleaner visuals, and brand systems that make your business stand out."
              Icon={PenTool}
              tone="brand-soft"
            />

            <ServiceCard
              title="Tracking & Analytics"
              text="Clear reporting and setup that helps you understand what is working and where to improve."
              Icon={BarChart3}
              tone="light"
            />
          </div>
        </div>

        <div className="grid gap-4 lg:col-span-5">
          <ServiceCard
            title="Social Media Content"
            text="Creative content systems for brands that want consistency, reach, and stronger presence."
            Icon={Clapperboard}
            tone="image"
            image="/home2.jpg"
            size="tall"
          />

          <CTAServiceCard onPrimaryClick={onPrimaryClick} />
        </div>
      </div>
    </HomeSection>
  );
}

function ServiceCard({
  title,
  text,
  Icon,
  tone = "light",
  image,
  size = "normal",
}) {
  const isImage = tone === "image";
  const isBrand = tone === "brand";
  const isBrandSoft = tone === "brand-soft";

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-[28px] border p-5 md:p-6",
        "flex flex-col justify-between transition duration-300",
        "hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.10)]",
        size === "hero" ? "min-h-[190px] md:min-h-[200px]" : "",
        size === "tall" ? "min-h-[380px] md:min-h-[410px]" : "",
        size === "normal" ? "min-h-[175px] md:min-h-[185px]" : "",
        isImage
          ? "border-black/10 text-white shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
          : "border-neutral-200 bg-white shadow-[0_14px_38px_rgba(0,0,0,0.06)]",
        isBrand ? "text-white" : "",
        isBrandSoft ? "text-neutral-950" : "",
      ].join(" ")}
      style={{
        background: isBrand
          ? "linear-gradient(135deg, #7F8AD1 0%, #919CE2 55%, #A8B1EF 100%)"
          : isBrandSoft
          ? "linear-gradient(180deg, rgba(127,138,209,0.14) 0%, rgba(127,138,209,0.06) 100%)"
          : undefined,
      }}
    >
      {isBrand ? (
        <>
          <div
            className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full blur-3xl"
            style={{ backgroundColor: "#ffffff", opacity: 0.12 }}
          />
          <div
            className="pointer-events-none absolute right-8 top-8 h-24 w-24 rounded-full blur-3xl"
            style={{ backgroundColor: "#ffffff", opacity: 0.08 }}
          />
        </>
      ) : null}

      {isImage ? (
        <>
          <img
            src={image}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-black/75" />
        </>
      ) : (
        <img
          src="/logo.png"
          alt=""
          className={[
            "pointer-events-none absolute object-contain",
            isBrand
              ? "right-4 top-4 h-24 w-24 opacity-20"
              : isBrandSoft
              ? "right-4 top-4 h-20 w-20 opacity-15"
              : "right-4 top-4 h-16 w-16 opacity-10",
          ].join(" ")}
          draggable={false}
        />
      )}

      <div className="relative z-10 flex h-full flex-col">
        <div
          className={[
            "flex h-11 w-11 items-center justify-center rounded-2xl border",
            isImage || isBrand
              ? "border-white/20 bg-white/10 text-white"
              : isBrandSoft
              ? "border-[rgba(127,138,209,0.20)] bg-white/75 text-neutral-950"
              : "border-black/10 bg-neutral-50 text-neutral-950",
          ].join(" ")}
        >
          <Icon size={18} />
        </div>

        <div className="mt-4">
          <h3
            className={[
              "text-xl font-black tracking-tight",
              isImage || isBrand ? "text-white" : "text-neutral-950",
            ].join(" ")}
          >
            {title}
          </h3>

          <p
            className={[
              "mt-2.5 max-w-xl text-sm leading-6",
              isImage || isBrand ? "text-white/[0.82]" : "text-neutral-600",
            ].join(" ")}
          >
            {text}
          </p>
        </div>

        <div className="mt-5">
          <a
            href="/services"
            className={[
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition hover:gap-2.5",
              isImage || isBrand
                ? "border border-white/15 bg-white/10 text-white hover:bg-white/18"
                : isBrandSoft
                ? "border border-[rgba(127,138,209,0.20)] bg-white/70 text-[#5762b8] hover:bg-white/90"
                : "border border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100",
            ].join(" ")}
          >
            Learn more
            <ArrowUpRight size={12} strokeWidth={2.5} />
          </a>
        </div>
      </div>
    </div>
  );
}

function CTAServiceCard({ onPrimaryClick }) {
  return (
    <div className="relative flex min-h-[175px] md:min-h-[185px] flex-col justify-between overflow-hidden rounded-[28px] border border-black/10 bg-neutral-950 p-5 md:p-6 text-white shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl"
        style={{ backgroundColor: BRAND, opacity: 0.3 }}
      />
      <div
        className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full blur-3xl"
        style={{ backgroundColor: BRAND, opacity: 0.18 }}
      />
      <img
        src="/logo.png"
        alt=""
        className="pointer-events-none absolute right-4 top-4 h-16 w-16 object-contain opacity-[0.06]"
        draggable={false}
      />

      <div className="relative z-10">
        <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-white/70">
          NEXT STEP
        </div>

        <h3 className="mt-3 text-[26px] font-black leading-tight tracking-tight">
          Need a custom mix?
        </h3>

        <p className="mt-2.5 max-w-md text-sm leading-6 text-white/75">
          Tell us your goals and we’ll shape the right website, content, ads,
          branding, and analytics setup for your business.
        </p>
      </div>

      <div className="relative z-10 mt-5 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onPrimaryClick}
          className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110"
          style={{
            background: "linear-gradient(135deg, #7F8AD1 0%, #D9DDFC 130%)",
          }}
        >
          Build Your Plan
          <ArrowUpRight size={16} />
        </button>

        <a
          href="/contact"
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Talk to Us
        </a>
      </div>
    </div>
  );
}
