import React from "react";
import { FaCode, FaThLarge, FaShoppingCart } from "react-icons/fa";

const BRAND = "#838FC6";

const OurWebServices = () => {
  const services = [
    {
      icon: <FaCode size={20} />,
      title: "React / Next.js Websites",
      desc: "Modern builds that feel premium, load fast, and convert — perfect for brands that want performance and flexibility.",
      points: [
        "Lightning-fast UX",
        "SEO-ready structure",
        "Scalable components",
        "Clean animations",
      ],
    },
    {
      icon: <FaThLarge size={20} />,
      title: "WordPress Websites",
      desc: "Flexible, editable websites with custom design — ideal for corporate sites, blogs, and content-heavy experiences.",
      points: [
        "Easy to manage",
        "SEO foundations",
        "Custom themes",
        "Plugin ecosystem",
      ],
    },
    {
      icon: <FaShoppingCart size={20} />,
      title: "eCommerce Stores",
      desc: "High-converting stores built for mobile shoppers — with smooth checkout and all the tools you need to scale.",
      points: [
        "Secure payments",
        "Inventory + products",
        "Mobile-first UX",
        "Tracking & analytics",
      ],
    },
  ];

  const handleGetQuote = () => {
    document
      .getElementById("lead-form")
      ?.scrollIntoView({ behavior: "smooth" });
    // fallback:
    // window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="relative bg-white py-16 md:py-20">
      {/* subtle brand glow */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl"
        style={{ backgroundColor: BRAND, opacity: 0.16 }}
      />

      <div className="mx-auto w-[min(1100px,92vw)]">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-neutral-200 pb-7">
          <div className="text-left">
            <p className="text-xs font-semibold tracking-[0.22em] text-neutral-500">
              SERVICES
            </p>
            <h2 className="mt-3 text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-neutral-950">
              BUILT FOR <br /> THE WEB
            </h2>
          </div>

          <p className="max-w-md text-left text-sm leading-relaxed text-neutral-600">
            Conversion-focused websites engineered for{" "}
            <span className="font-semibold text-neutral-900">speed</span>,{" "}
            <span className="font-semibold text-neutral-900">clarity</span>, and{" "}
            <span className="font-semibold text-neutral-900">growth</span>.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <div
              key={index}
              className={[
                "group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-7 text-left",
                "shadow-[0_14px_45px_rgba(0,0,0,0.06)] transition",
                "hover:-translate-y-1 hover:shadow-[0_22px_70px_rgba(0,0,0,0.10)]",
              ].join(" ")}
            >
              {/* top highlight bar */}
              <div
                className="absolute left-0 top-0 h-1 w-full"
                style={{ backgroundColor: BRAND, opacity: 0.9 }}
              />

              {/* icon */}
              <div className="flex items-center gap-3">
                <div
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50"
                  style={{
                    boxShadow: "0 18px 60px rgba(0,0,0,0.06)",
                  }}
                >
                  <span style={{ color: BRAND }}>{service.icon}</span>
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold text-neutral-950">
                    {service.title}
                  </h3>
                  <p className="mt-0.5 text-xs font-semibold text-neutral-500">
                    Premium • Fast • Conversion-ready
                  </p>
                </div>
              </div>

              {/* description */}
              <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                {service.desc}
              </p>

              {/* points */}
              <ul className="mt-5 space-y-2 text-sm text-neutral-700">
                {service.points.map((point, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: BRAND, opacity: 0.9 }}
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={handleGetQuote}
                className={[
                  "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3",
                  "text-sm font-extrabold text-white transition active:scale-[0.99]",
                ].join(" ")}
                style={{
                  backgroundColor: BRAND,
                  boxShadow: "0 18px 60px rgba(131,143,198,0.35)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.filter = "brightness(0.98)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
              >
                Get Quote
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>

              {/* subtle corner glow on hover */}
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{ backgroundColor: BRAND, opacity: 0.18 }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OurWebServices;
