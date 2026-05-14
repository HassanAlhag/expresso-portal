// src/components/LandingHero/LandingHero.jsx
import { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { FaUser, FaEnvelope, FaPhone } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImage } from "../../utils/websiteImages";

// ... keep your imports and component as-is

const BRAND = "#838FC6";

const LandingHeroSection = () => {
  const formRef = useRef();
  const navigate = useNavigate();
  const settings = useSiteSettings();
  const backgroundImage = resolveWebsiteImage(settings, "/landinghero.jpg");
  const logo = resolveWebsiteImage(settings, "/white-logo.png");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showOptional, setShowOptional] = useState(false);

  const sendEmail = (e) => {
    e.preventDefault();
    setErrorMsg("");

    setLoading(true);
    emailjs
      .sendForm(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_LANDING_TEMPLATE_ID,
        formRef.current,
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      )
      .then(() => navigate("/greetings"))
      .catch(() => setErrorMsg("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  };

  return (
    <section className="relative overflow-hidden bg-neutral-950 text-white">
      {/* keep your background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-35"
        style={{ backgroundImage: `url('${backgroundImage}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/80" />
      <div
        className="pointer-events-none absolute -left-36 -top-36 h-[520px] w-[520px] rounded-full blur-3xl"
        style={{ backgroundColor: BRAND, opacity: 0.18 }}
      />

      <div className="relative z-10 mx-auto w-[min(1180px,92vw)] py-10 md:py-14">
        {/* top logo */}
        <div className="flex items-center justify-between">
          <img
            src={logo}
            alt="Expresso Digital"
            className="h-16 w-auto object-contain md:h-20"
          />
        </div>

        <div className="mt-10 grid grid-cols-1 items-center gap-10 md:grid-cols-12">
          {/* LEFT */}
          <div className="md:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: BRAND }}
              />
              Performance + Design + Conversions
            </div>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              BUILD FAST.
              <br />
              <span style={{ color: BRAND }}>SCALE SMART.</span>
              <br />
              GROW ONLINE.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 md:text-lg">
              Premium websites & landing pages designed to convert — fast,
              responsive, and built for modern marketing.
            </p>

            <div className="mt-8 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                "Free proposal in 24 hours",
                "Mobile-first & SEO-ready",
                "Conversion-focused layout",
                "WhatsApp-friendly support",
              ].map((b) => (
                <div
                  key={b}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85 backdrop-blur"
                >
                  <span className="mr-2" style={{ color: BRAND }}>
                    ●
                  </span>
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT FORM */}
          <div className="md:col-span-5">
            <div
              id="lead-form"
              className="relative rounded-[26px] border border-white/12 bg-white/10 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:p-7"
            >
              <div
                className="absolute left-6 right-6 top-0 h-1 -translate-y-1/2 rounded-full"
                style={{ backgroundColor: BRAND, opacity: 0.9 }}
              />

              <div className="mb-5">
                <h3 className="text-xl font-extrabold text-white">
                  Get a Free Proposal in 24 Hours
                </h3>
                <p className="mt-1 text-sm text-white/70">
                  Share your details — we’ll send a plan + timeline + estimate.
                </p>
              </div>

              <form ref={formRef} onSubmit={sendEmail} className="space-y-3">
                {/* Name */}
                <Field icon="user" brand={BRAND}>
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    className="w-full bg-transparent text-sm text-white placeholder:text-white/55 focus:outline-none"
                    required
                  />
                </Field>

                {/* Phone */}
                <Field icon="phone" brand={BRAND}>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone / WhatsApp"
                    className="w-full bg-transparent text-sm text-white placeholder:text-white/55 focus:outline-none"
                    required
                  />
                </Field>

                {/* Email */}
                <Field icon="email" brand={BRAND}>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    className="w-full bg-transparent text-sm text-white placeholder:text-white/55 focus:outline-none"
                    required
                  />
                </Field>

                {/* Optional details toggle */}
                <button
                  type="button"
                  onClick={() => setShowOptional((v) => !v)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-xs font-semibold text-white/80 backdrop-blur transition hover:bg-white/10"
                >
                  {showOptional
                    ? "Hide details (optional)"
                    : "+ Add details (optional)"}
                </button>

                {showOptional ? (
                  <>
                    <div className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3 backdrop-blur">
                      <select
                        name="service"
                        className="w-full bg-transparent text-sm text-white focus:outline-none"
                        defaultValue="Website"
                        style={{ colorScheme: "dark" }}
                      >
                        <option value="Website">Website Development</option>
                        <option value="Landing">Landing Page / PPC</option>
                        <option value="Ecommerce">eCommerce</option>
                        <option value="Maintenance">
                          Maintenance & Support
                        </option>
                      </select>
                    </div>

                    <div className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3 backdrop-blur">
                      <textarea
                        name="message"
                        rows={3}
                        placeholder="Your goal (optional) — leads, sales, branding?"
                        className="w-full resize-none bg-transparent text-sm text-white placeholder:text-white/55 focus:outline-none"
                      />
                    </div>
                  </>
                ) : null}

                {errorMsg ? (
                  <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {errorMsg}
                  </div>
                ) : null}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className={[
                    "mt-2 flex w-full items-center justify-center rounded-2xl py-3 text-sm font-extrabold transition",
                    loading
                      ? "cursor-not-allowed bg-white/15 text-white/60"
                      : "bg-white text-neutral-950 hover:brightness-110",
                  ].join(" ")}
                >
                  {loading ? "Submitting..." : "Get My Proposal →"}
                </button>

                {/* Trust */}
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px] text-white/65">
                  <div className="rounded-xl border border-white/10 bg-white/5 py-2">
                    No spam
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 py-2">
                    Reply in 24h
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 py-2">
                    WhatsApp OK
                  </div>
                </div>

                <p className="pt-1 text-center text-xs text-white/55">
                  By submitting, you agree to be contacted about your request.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

function Field({ children, icon, brand }) {
  const iconNode =
    icon === "user" ? (
      <FaUser className="text-white/55" />
    ) : icon === "phone" ? (
      <FaPhone className="text-white/55" />
    ) : (
      <FaEnvelope className="text-white/55" />
    );

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/5 px-4 py-3 backdrop-blur">
      <div
        className="grid h-9 w-9 place-items-center rounded-xl bg-white/5"
        style={{ outline: `1px solid rgba(255,255,255,0.08)` }}
        title="Field"
      >
        <span style={{ color: brand }}>{iconNode}</span>
      </div>
      {children}
    </div>
  );
}

export default LandingHeroSection;
