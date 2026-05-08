// src/components/PlanBuilder/PlanBuilder.jsx
import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const BRAND = "#7F8AD1";

const steps = [
  { id: "goal", label: "Goal" },
  { id: "services", label: "Services" },
  { id: "style", label: "Style" },
  { id: "timeline", label: "Timeline" },
  { id: "details", label: "Details" },
  { id: "result", label: "Result" },
];

const GOALS = [
  {
    id: "leads",
    title: "Get More Leads",
    desc: "Turn visitors into inquiries.",
    emoji: "🎯",
  },
  {
    id: "sales",
    title: "Increase Sales",
    desc: "Boost conversions & revenue.",
    emoji: "💳",
  },
  {
    id: "brand",
    title: "Build a Brand",
    desc: "Look premium & consistent.",
    emoji: "✨",
  },
  {
    id: "launch",
    title: "Launch Fast",
    desc: "Go live quickly & clean.",
    emoji: "🚀",
  },
];

const SERVICES = [
  { id: "website", title: "Website / Landing Page", emoji: "🖥️" },
  { id: "content", title: "Social Media Content", emoji: "🎬" },
  { id: "seo", title: "SEO", emoji: "🔎" },
  { id: "ads", title: "Google Ads / PPC", emoji: "📈" },
  { id: "branding", title: "Branding", emoji: "🎨" },
  { id: "analytics", title: "Tracking & Analytics", emoji: "🧠" },
];

const STYLES = [
  {
    id: "minimal",
    title: "Minimal",
    desc: "Clean, modern, white space.",
    chip: "Crisp",
  },
  {
    id: "luxury",
    title: "Luxury",
    desc: "Elegant, premium, refined.",
    chip: "Premium",
  },
  {
    id: "bold",
    title: "Bold",
    desc: "High contrast, strong headlines.",
    chip: "Impact",
  },
  {
    id: "playful",
    title: "Playful",
    desc: "Friendly, energetic, colorful.",
    chip: "Fun",
  },
];

const TIMELINES = [
  { id: "asap", title: "ASAP", desc: "7–14 days" },
  { id: "month", title: "1 Month", desc: "Polished & ready" },
  { id: "quarter", title: "2–3 Months", desc: "More depth & iterations" },
];

const cardMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageMotion = {
  initial: { opacity: 0, x: 14 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -14 },
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function PlanBuilder({ onFinish }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [data, setData] = useState({
    goal: null,
    services: [],
    style: null,
    timeline: null,
    name: "",
    contact: "",
    note: "",
  });

  const currentStep = steps[stepIndex]?.id;

  const progress = useMemo(() => {
    // stepIndex 0..5 -> 0..100
    return Math.round((stepIndex / (steps.length - 1)) * 100);
  }, [stepIndex]);

  const canNext = useMemo(() => {
    if (currentStep === "goal") return !!data.goal;
    if (currentStep === "services") return data.services.length > 0;
    if (currentStep === "style") return !!data.style;
    if (currentStep === "timeline") return !!data.timeline;
    if (currentStep === "details")
      return data.name.trim() && data.contact.trim();
    return true;
  }, [currentStep, data]);

  const recommendation = useMemo(() => {
    const { goal, services, style, timeline } = data;

    const intensity =
      (services.includes("ads") ? 2 : 0) +
      (services.includes("seo") ? 2 : 0) +
      (services.includes("website") ? 2 : 0) +
      (services.includes("content") ? 1 : 0) +
      (services.includes("branding") ? 1 : 0) +
      (services.includes("analytics") ? 1 : 0);

    const plan =
      intensity <= 3 ? "Starter" : intensity <= 6 ? "Growth" : "Scale";

    const headline =
      goal === "leads"
        ? "Lead Engine Setup"
        : goal === "sales"
        ? "Conversion Boost Plan"
        : goal === "brand"
        ? "Brand + Presence Upgrade"
        : "Fast Launch Sprint";

    const vibe =
      style === "luxury"
        ? "Premium aesthetic, clean typography, refined layouts."
        : style === "bold"
        ? "High-impact sections, strong CTAs, punchy messaging."
        : style === "playful"
        ? "Friendly tone, energetic visuals, engaging motion."
        : "Minimal UI, fast load, conversion-first layout.";

    const speed =
      timeline === "asap"
        ? "We’ll prioritize essentials and ship fast."
        : timeline === "month"
        ? "Balanced timeline for polish + performance."
        : "More iteration room: content, optimization, testing.";

    return { plan, headline, vibe, speed };
  }, [data]);

  const buildLeadPayload = () => {
    const selectedGoal = GOALS.find((g) => g.id === data.goal)?.title || "—";
    const selectedStyle = STYLES.find((s) => s.id === data.style)?.title || "—";
    const selectedTimeline =
      TIMELINES.find((t) => t.id === data.timeline)?.title || "—";

    const selectedServices = data.services.length
      ? data.services
          .map((id) => SERVICES.find((s) => s.id === id)?.title)
          .filter(Boolean)
          .join(", ")
      : "—";

    const contactValue = String(data.contact || "").trim();
    const looksLikeEmail = contactValue.includes("@");

    return {
      fullName: String(data.name || "").trim(),
      companyName: "Plan Builder Submission",
      email: looksLikeEmail ? contactValue.toLowerCase() : "",
      phone: looksLikeEmail ? "" : contactValue,
      source: "plan_builder",
      status: "new",
      notes: `Plan Builder Submission
      
      Goal: ${selectedGoal}
      Services: ${selectedServices}
      Style: ${selectedStyle}
      Timeline: ${selectedTimeline}
      Recommended Plan: ${recommendation.plan}
      Recommended Direction: ${recommendation.headline}
      
      Name: ${String(data.name || "").trim()}
      Contact: ${contactValue}
      
      User Note:
      ${String(data.note || "").trim() || "—"}`,
    };
  };

  const handleSubmitPlan = async () => {
    try {
      setSubmitting(true);

      const payload = buildLeadPayload();

      const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5050/api";
      const res = await fetch(
        `${API_BASE}/public/plan-submissions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.message || "Failed to submit plan");
      }

      setSubmitted(true);
      alert("Your plan was sent successfully.");
    } catch (err) {
      alert(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    if (!canNext) {
      setShake(true);
      setTimeout(() => setShake(false), 450);
      return;
    }
    setStepIndex((i) => clamp(i + 1, 0, steps.length - 1));
  };

  const back = () => setStepIndex((i) => clamp(i - 1, 0, steps.length - 1));

  const toggleService = (id) => {
    setData((d) => {
      const has = d.services.includes(id);
      const services = has
        ? d.services.filter((x) => x !== id)
        : [...d.services, id];
      return { ...d, services };
    });
  };

  const reset = () => {
    setData({
      goal: null,
      services: [],
      style: null,
      timeline: null,
      name: "",
      contact: "",
      note: "",
    });
    setStepIndex(0);
  };

  const finish = () => {
    const payload = { ...data, recommendation };
    onFinish?.(payload); // optional callback
    setStepIndex(steps.findIndex((s) => s.id === "result"));
  };

  return (
    <section className="bg-white">
      <div className="mx-auto w-[min(1200px,92vw)] py-10 md:py-14">
        {/* Top Header */}
        <div className="mb-8 md:mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold text-neutral-700">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: BRAND }}
            />
            Interactive Project Builder
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl md:text-5xl">
            <span style={{ color: BRAND }}>Design</span>{" "}
            <span className="text-neutral-950">your perfect plan</span>
          </h2>

          <p className="mt-3 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            Pick your goal, choose what you need, and we’ll generate a clean
            plan summary — fun, fast, and easy.
          </p>

          {/* Progress */}
          <div className="mt-5 flex items-center gap-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: BRAND }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>
            <div className="w-14 text-right text-xs font-semibold text-neutral-600">
              {progress}%
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* LEFT: Steps */}
          <motion.div
            className="lg:col-span-7"
            animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-[0_16px_55px_rgba(0,0,0,0.06)] sm:p-7">
              {/* Step pills */}
              <div className="mb-6 flex flex-wrap gap-2">
                {steps.slice(0, 5).map((s, i) => {
                  const on = i === stepIndex;
                  const done = i < stepIndex;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStepIndex(i)}
                      className={[
                        "rounded-full border px-4 py-2 text-xs font-semibold transition",
                        on
                          ? "bg-neutral-950 text-white border-neutral-950"
                          : "bg-white text-neutral-700 border-neutral-200",
                        done && !on ? "opacity-100" : "",
                      ].join(" ")}
                      title={s.label}
                    >
                      {done ? "✓ " : ""}
                      {s.label}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                {currentStep === "goal" && (
                  <motion.div key="goal" {...pageMotion}>
                    <StepTitle
                      title="What’s your main goal?"
                      subtitle="Choose one — this shapes the plan recommendations."
                    />
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      {GOALS.map((g) => (
                        <PickCard
                          key={g.id}
                          selected={data.goal === g.id}
                          onClick={() => setData((d) => ({ ...d, goal: g.id }))}
                          title={g.title}
                          desc={g.desc}
                          badge={g.emoji}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {currentStep === "services" && (
                  <motion.div key="services" {...pageMotion}>
                    <StepTitle
                      title="What do you want us to build?"
                      subtitle="Pick all that apply — mix & match freely."
                    />
                    <div className="mt-5 flex flex-wrap gap-2">
                      {SERVICES.map((s) => {
                        const on = data.services.includes(s.id);
                        return (
                          <Chip
                            key={s.id}
                            on={on}
                            onClick={() => toggleService(s.id)}
                            label={`${s.emoji} ${s.title}`}
                          />
                        );
                      })}
                    </div>

                    <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                      <p className="text-sm text-neutral-700">
                        Selected:{" "}
                        <span className="font-semibold text-neutral-950">
                          {data.services.length ? data.services.length : "None"}
                        </span>
                      </p>
                    </div>
                  </motion.div>
                )}

                {currentStep === "style" && (
                  <motion.div key="style" {...pageMotion}>
                    <StepTitle
                      title="Choose the vibe"
                      subtitle="This controls how the visuals feel."
                    />
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      {STYLES.map((s) => (
                        <PickCard
                          key={s.id}
                          selected={data.style === s.id}
                          onClick={() =>
                            setData((d) => ({ ...d, style: s.id }))
                          }
                          title={s.title}
                          desc={s.desc}
                          chip={s.chip}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {currentStep === "timeline" && (
                  <motion.div key="timeline" {...pageMotion}>
                    <StepTitle
                      title="When do you want to start?"
                      subtitle="Timeline helps us prioritize the right scope."
                    />
                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      {TIMELINES.map((t) => (
                        <PickCard
                          key={t.id}
                          selected={data.timeline === t.id}
                          onClick={() =>
                            setData((d) => ({ ...d, timeline: t.id }))
                          }
                          title={t.title}
                          desc={t.desc}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {currentStep === "details" && (
                  <motion.div key="details" {...pageMotion}>
                    <StepTitle
                      title="Where should we send your plan?"
                      subtitle="This stays front-end for now (no backend)."
                    />

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <Input
                        label="Name"
                        value={data.name}
                        onChange={(v) => setData((d) => ({ ...d, name: v }))}
                        placeholder="Your name"
                      />
                      <Input
                        label="Email or WhatsApp"
                        value={data.contact}
                        onChange={(v) => setData((d) => ({ ...d, contact: v }))}
                        placeholder="name@email.com or +971..."
                      />
                    </div>

                    <div className="mt-4">
                      <label className="text-xs font-semibold text-neutral-700">
                        Notes (optional)
                      </label>
                      <textarea
                        value={data.note}
                        onChange={(e) =>
                          setData((d) => ({ ...d, note: e.target.value }))
                        }
                        className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-indigo-500/30"
                        rows={4}
                        placeholder="Tell us anything helpful (industry, inspiration, links, goals)…"
                      />
                    </div>
                  </motion.div>
                )}

                {currentStep === "result" && (
                  <motion.div key="result" {...pageMotion}>
                    <div className="rounded-3xl border border-neutral-200 bg-white p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold tracking-[0.22em] text-neutral-500">
                            PLAN READY
                          </p>
                          <h3 className="mt-2 text-2xl font-black tracking-tight text-neutral-950 sm:text-3xl">
                            <span style={{ color: BRAND }}>
                              {recommendation.plan}
                            </span>{" "}
                            <span className="text-neutral-950">Plan</span>
                          </h3>
                          <p className="mt-2 text-sm text-neutral-600">
                            {recommendation.headline}
                          </p>
                        </div>

                        <div
                          className="rounded-2xl border px-4 py-2 text-xs font-semibold"
                          style={{
                            borderColor: "rgba(127,138,209,0.25)",
                            backgroundColor: "rgba(127,138,209,0.10)",
                            color: BRAND,
                          }}
                        >
                          ✓ Personalized
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <MiniPanel title="Vibe" text={recommendation.vibe} />
                        <MiniPanel
                          title="Timeline fit"
                          text={recommendation.speed}
                        />
                        <MiniPanel
                          title="Selected services"
                          text={
                            data.services.length
                              ? data.services
                                  .map(
                                    (id) =>
                                      SERVICES.find((s) => s.id === id)?.title
                                  )
                                  .filter(Boolean)
                                  .join(", ")
                              : "—"
                          }
                        />
                        <MiniPanel
                          title="Contact"
                          text={`${data.name} • ${data.contact}`}
                        />
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={reset}
                          className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
                        >
                          Start Over
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            alert(
                              "Front-end only ✅ (connect later if you want)"
                            )
                          }
                          className="rounded-2xl bg-neutral-950 px-6 py-3 text-sm font-semibold text-white hover:brightness-110"
                        >
                          Download Summary (later)
                        </button>

                        <button
                          type="button"
                          onClick={handleSubmitPlan}
                          disabled={submitting || submitted}
                          className="rounded-2xl px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
                          style={{ backgroundColor: BRAND }}
                        >
                          {submitting
                            ? "Sending..."
                            : submitted
                            ? "Sent ✓"
                            : "Send This Plan"}
                        </button>

                        {submitted ? (
                          <p
                            className="mt-3 text-sm font-semibold"
                            style={{ color: BRAND }}
                          >
                            Thanks — your plan was sent to our team
                            successfully.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer actions */}
              {currentStep !== "result" ? (
                <div className="mt-7 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={back}
                    disabled={stepIndex === 0}
                    className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 disabled:opacity-40"
                  >
                    Back
                  </button>

                  {currentStep === "details" ? (
                    <button
                      type="button"
                      onClick={finish}
                      className="rounded-2xl px-6 py-3 text-sm font-semibold text-black shadow-[0_18px_55px_rgba(0,0,0,0.18)]"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(127,138,209,1) 0%, rgba(255,255,255,0.95) 110%)",
                      }}
                    >
                      Generate My Plan →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={next}
                      className="rounded-2xl px-6 py-3 text-sm font-semibold text-black shadow-[0_18px_55px_rgba(0,0,0,0.18)]"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(127,138,209,1) 0%, rgba(255,255,255,0.95) 110%)",
                      }}
                    >
                      Continue →
                    </button>
                  )}
                </div>
              ) : null}

              {!canNext && currentStep !== "result" ? (
                <p className="mt-3 text-xs font-semibold text-neutral-500">
                  Pick an option to continue.
                </p>
              ) : null}
            </div>
          </motion.div>

          {/* RIGHT: Live Preview */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 rounded-3xl border border-neutral-200 bg-neutral-950 p-6 text-white shadow-[0_22px_75px_rgba(0,0,0,0.20)]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-[0.22em] text-white/70">
                  YOUR PLAN PREVIEW
                </p>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: BRAND }}
                />
              </div>

              <h3 className="mt-3 text-2xl font-black tracking-tight">
                <span style={{ color: BRAND }}>
                  {recommendation.plan || "Starter"}
                </span>{" "}
                Plan
              </h3>

              <p className="mt-2 text-sm text-white/75">
                {recommendation.headline}
              </p>

              <div className="mt-5 space-y-3">
                <PreviewRow
                  label="Goal"
                  value={
                    data.goal
                      ? GOALS.find((g) => g.id === data.goal)?.title
                      : "—"
                  }
                />
                <PreviewRow
                  label="Services"
                  value={
                    data.services.length
                      ? `${data.services.length} selected`
                      : "—"
                  }
                />
                <PreviewRow
                  label="Style"
                  value={
                    data.style
                      ? STYLES.find((s) => s.id === data.style)?.title
                      : "—"
                  }
                />
                <PreviewRow
                  label="Timeline"
                  value={
                    data.timeline
                      ? TIMELINES.find((t) => t.id === data.timeline)?.title
                      : "—"
                  }
                />
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white/90">Notes</p>
                <p className="mt-2 text-sm text-white/70 line-clamp-4">
                  {data.note?.trim()
                    ? data.note
                    : "Add optional notes to tailor the plan."}
                </p>
              </div>

              <div className="mt-6">
                <div className="h-px w-full bg-white/10" />
                <p className="mt-4 text-xs text-white/55">
                  Tip: This is front-end only. Later we can connect it to
                  email/CRM.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- UI helpers ---------- */

function StepTitle({ title, subtitle }) {
  return (
    <div>
      <h3 className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        {subtitle}
      </p>
    </div>
  );
}

function PickCard({ selected, onClick, title, desc, badge, chip }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={[
        "relative overflow-hidden rounded-3xl border p-5 text-left transition",
        selected
          ? "border-neutral-950 bg-neutral-950 text-white"
          : "border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50",
      ].join(" ")}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      {...cardMotion}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-extrabold tracking-tight">{title}</p>
          <p
            className={[
              "mt-1 text-sm",
              selected ? "text-white/70" : "text-neutral-600",
            ].join(" ")}
          >
            {desc}
          </p>
        </div>

        {badge ? (
          <div
            className={[
              "text-2xl",
              selected ? "opacity-100" : "opacity-90",
            ].join(" ")}
          >
            {badge}
          </div>
        ) : null}
      </div>

      {chip ? (
        <div className="mt-4">
          <span
            className={[
              "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
              selected
                ? "border-white/15 bg-white/10 text-white/85"
                : "border-neutral-200 bg-neutral-50 text-neutral-700",
            ].join(" ")}
          >
            {chip}
          </span>
        </div>
      ) : null}

      {/* subtle glow */}
      <div
        className={[
          "pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl transition-opacity",
          selected ? "opacity-40" : "opacity-0",
        ].join(" ")}
        style={{ backgroundColor: BRAND }}
      />
    </motion.button>
  );
}

function Chip({ on, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-4 py-2 text-sm font-semibold transition",
        on
          ? "border-neutral-950 bg-neutral-950 text-white"
          : "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function Input({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs font-semibold text-neutral-700">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-indigo-500/30"
      />
    </div>
  );
}

function PreviewRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <span className="text-xs font-semibold text-white/60">{label}</span>
      <span className="text-sm font-semibold text-white/90">{value}</span>
    </div>
  );
}

function MiniPanel({ title, text }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-xs font-semibold tracking-[0.18em] text-neutral-500">
        {title.toUpperCase()}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-neutral-700">{text}</p>
    </div>
  );
}
