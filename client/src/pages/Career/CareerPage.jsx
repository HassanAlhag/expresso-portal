import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiMapPin,
  FiClock,
  FiZap,
  FiTrendingUp,
  FiHeart,
  FiBook,
  FiDollarSign,
  FiUsers,
  FiBriefcase,
  FiCode,
  FiVideo,
  FiSearch,
  FiShare2,
  FiPenTool,
  FiStar,
  FiUpload,
  FiX,
  FiCheckCircle,
} from "react-icons/fi";
import AuroraHero from "../../components/BannerSection/bannerSection";
import HomeSection from "../../components/HomeSection/HomeSection";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImage } from "../../utils/websiteImages";
import { listPublicCareers, uploadCV, applyForCareer } from "../../api/careers";

const BRAND = "#7F8AD1";
const BRAND_BG = "rgba(127,138,209,0.12)";

const PERKS = [
  {
    Icon: FiZap,
    title: "Move Fast, Learn Faster",
    desc: "You'll work across real campaigns and live projects from week one. No busy work — just meaningful output.",
  },
  {
    Icon: FiTrendingUp,
    title: "Clear Growth Path",
    desc: "Defined levelling, quarterly reviews, and a team that actively invests in your progression.",
  },
  {
    Icon: FiHeart,
    title: "Culture That Cares",
    desc: "Flexible hours, hybrid work, and a leadership team that treats people like adults.",
  },
  {
    Icon: FiBook,
    title: "Learning Budget",
    desc: "Annual budget for courses, certifications and industry events — because your skills compound ours.",
  },
  {
    Icon: FiDollarSign,
    title: "Competitive Compensation",
    desc: "Market-rate salaries, performance bonuses, and transparent pay bands reviewed twice a year.",
  },
  {
    Icon: FiUsers,
    title: "Strong Team Energy",
    desc: "Monthly team events, creative offsites, and people who genuinely enjoy working together.",
  },
];

const DEPT_META = {
  Marketing: { Icon: FiShare2, bg: "rgba(99,102,241,0.10)", text: "#6366f1" },
  "Digital Marketing": {
    Icon: FiSearch,
    bg: "rgba(16,185,129,0.10)",
    text: "#059669",
  },
  Production: { Icon: FiVideo, bg: "rgba(244,63,94,0.10)", text: "#e11d48" },
  Technology: { Icon: FiCode, bg: "rgba(59,130,246,0.10)", text: "#2563eb" },
  Creative: { Icon: FiPenTool, bg: "rgba(245,158,11,0.10)", text: "#d97706" },
  "Client Success": {
    Icon: FiBriefcase,
    bg: "rgba(139,92,246,0.10)",
    text: "#7c3aed",
  },
};

const DEFAULT_DEPT = { Icon: FiBriefcase, bg: BRAND_BG, text: BRAND };

function PerkCard({ Icon, title, desc }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-white/8 bg-white/4 p-6 backdrop-blur-sm"
    >
      <span
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: BRAND_BG, color: BRAND }}
      >
        <Icon size={20} />
      </span>
      <h3 className="mt-4 text-[15px] font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/60">{desc}</p>
    </motion.div>
  );
}

function JobCard({
  _id,
  title,
  department,
  type,
  location,
  summary,
  responsibilities = [],
  onApply,
}) {
  const [open, setOpen] = useState(false);
  const meta = DEPT_META[department] || DEFAULT_DEPT;
  const { Icon } = meta;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className="group rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: meta.bg, color: meta.text }}
            >
              <Icon size={10} />
              {department}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[10px] font-semibold text-neutral-500">
              <FiClock size={10} />
              {type}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[10px] font-semibold text-neutral-500">
              <FiMapPin size={10} />
              {location}
            </span>
          </div>

          <h3 className="mt-3 text-lg font-bold text-neutral-900">{title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
            {summary}
          </p>
        </div>
      </div>

      {open && responsibilities.length > 0 && (
        <motion.ul
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 space-y-1.5 border-t border-neutral-100 pt-4"
        >
          {responsibilities.map((r, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-neutral-600"
            >
              <FiStar
                size={12}
                className="mt-1 flex-shrink-0"
                style={{ color: BRAND }}
              />
              {r}
            </li>
          ))}
        </motion.ul>
      )}

      <div className="mt-5 flex items-center gap-3">
        {responsibilities.length > 0 && (
          <button
            onClick={() => setOpen((s) => !s)}
            className="text-xs font-semibold text-neutral-400 transition hover:text-neutral-700"
          >
            {open ? "Hide details" : "View details"}
          </button>
        )}
        <button
          onClick={() => onApply?.({ _id, title, department })}
          className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 active:scale-95"
          style={{ backgroundColor: BRAND }}
        >
          Apply Now <FiArrowRight size={12} />
        </button>
      </div>
    </motion.div>
  );
}

function JobSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 animate-pulse">
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-20 rounded-full bg-neutral-100" />
        <div className="h-5 w-16 rounded-full bg-neutral-100" />
        <div className="h-5 w-24 rounded-full bg-neutral-100" />
      </div>
      <div className="h-6 w-56 rounded bg-neutral-100 mb-2" />
      <div className="h-4 w-full rounded bg-neutral-100 mb-1" />
      <div className="h-4 w-3/4 rounded bg-neutral-100" />
    </div>
  );
}

const EMPTY_FORM = { fullName: "", email: "", phone: "", coverLetter: "" };

function ApplyModal({ job, onClose }) {
  const fileRef = useRef(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [cvFile, setCvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f) setCvFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      let cvUrl = "";
      if (cvFile) {
        setUploading(true);
        const up = await uploadCV(cvFile);
        setUploading(false);
        cvUrl = up?.cvUrl || "";
      }
      await applyForCareer(job._id, { ...form, cvUrl });
      setDone(true);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Submission failed. Please try again."
      );
    } finally {
      setBusy(false);
      setUploading(false);
    }
  };

  if (!job) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
              {job.department}
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-neutral-900">
              {job.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition"
          >
            <FiX size={18} />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(127,138,209,0.12)" }}
            >
              <FiCheckCircle size={28} style={{ color: BRAND }} />
            </div>
            <h3 className="text-xl font-bold text-neutral-900">
              Application sent!
            </h3>
            <p className="text-sm text-neutral-500">
              Thanks for applying for <strong>{job.title}</strong>. We'll review
              your application and get back to you.
            </p>
            <button
              onClick={onClose}
              className="mt-2 inline-flex items-center gap-2 rounded-2xl px-6 py-2.5 text-sm font-bold text-white"
              style={{ backgroundColor: BRAND }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 px-6 py-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.15em] text-neutral-500">
                  Full name *
                </span>
                <input
                  required
                  value={form.fullName}
                  onChange={set("fullName")}
                  placeholder="Sara Al-Mansoori"
                  className="h-10 rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm outline-none focus:border-indigo-300 focus:bg-white transition"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.15em] text-neutral-500">
                  Email *
                </span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="sara@example.com"
                  className="h-10 rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm outline-none focus:border-indigo-300 focus:bg-white transition"
                />
              </label>
            </div>

            <label className="grid gap-1.5">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.15em] text-neutral-500">
                Phone (optional)
              </span>
              <input
                value={form.phone}
                onChange={set("phone")}
                placeholder="+971 50 000 0000"
                className="h-10 rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm outline-none focus:border-indigo-300 focus:bg-white transition"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.15em] text-neutral-500">
                Cover letter (optional)
              </span>
              <textarea
                value={form.coverLetter}
                onChange={set("coverLetter")}
                rows={3}
                placeholder="Tell us why you're a great fit for this role…"
                className="resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-300 focus:bg-white transition"
              />
            </label>

            {/* CV Upload */}
            <div className="grid gap-1.5">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.15em] text-neutral-500">
                CV / Resume (PDF, DOC — max 10 MB)
              </span>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={[
                  "flex items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3 text-sm transition",
                  cvFile
                    ? "border-indigo-300 bg-indigo-50/50 text-indigo-700"
                    : "border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-indigo-200 hover:bg-indigo-50/30",
                ].join(" ")}
              >
                <FiUpload size={15} className="flex-shrink-0" />
                {cvFile ? cvFile.name : "Click to upload your CV"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleFile}
              />
            </div>

            {error && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: BRAND }}
              >
                {uploading
                  ? "Uploading CV…"
                  : busy
                  ? "Submitting…"
                  : "Submit Application"}
                {!busy && <FiArrowRight size={13} />}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default function CareerPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyJob, setApplyJob] = useState(null);
  const settings = useSiteSettings();

  const careerHeroImage = resolveWebsiteImage(
    settings,
    settings?.careers?.heroImageUrl || "/81.webp"
  );

  useEffect(() => {
    listPublicCareers()
      .then((data) => setJobs(Array.isArray(data?.items) ? data.items : []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <AuroraHero
        heading="We're Hiring"
        subtitle="Build Your Career at Expresso"
        description="Join a team of creators, strategists and engineers building brands that people actually remember. We move fast, think big, and take care of our people."
        backgroundImageUrl={careerHeroImage}
      />

      {/* Perks — dark */}
      <HomeSection
        eyebrow="Why Expresso"
        title="A place where"
        highlight="talent thrives"
        subtitle="We're selective about who we hire because we're serious about the environment we build. Here's what you can expect."
        theme="dark"
        className="bg-neutral-950"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PERKS.map((p) => (
            <PerkCard key={p.title} {...p} />
          ))}
        </div>
      </HomeSection>

      {/* Open positions — light */}
      <HomeSection
        eyebrow="Open Roles"
        title="Current"
        highlight="openings"
        subtitle="We're looking for curious, driven people across creative, technical and strategic disciplines."
        align="center"
      >
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <JobSkeleton key={i} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 py-16 text-center">
            <p className="text-base font-semibold text-neutral-400">
              No open positions right now.
            </p>
            <p className="mt-2 text-sm text-neutral-400">
              Check back soon or send us a speculative application below.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {jobs.map((j) => (
              <JobCard key={j._id} {...j} onApply={setApplyJob} />
            ))}
          </div>
        )}
      </HomeSection>

      {/* Bottom CTA */}
      <section className="bg-neutral-950 py-20">
        <div className="mx-auto w-[min(1200px,92vw)] text-center">
          <span
            className="inline-block rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest"
            style={{
              borderColor: "rgba(127,138,209,0.35)",
              backgroundColor: "rgba(127,138,209,0.08)",
              color: "#a5aee8",
            }}
          >
            Don't see your role?
          </span>
          <h2 className="font-dax-compact mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            We love hearing from people
            <br />
            who <span style={{ color: BRAND }}>stand out.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/55">
            Send us your CV and a note on what excites you about Expresso. If
            there's a fit now or soon, we'll reach out.
          </p>
          <button
            onClick={() => navigate("/contact-us")}
            className="mt-8 inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold text-white transition hover:opacity-90 active:scale-95"
            style={{ backgroundColor: BRAND }}
          >
            Send us a message <FiArrowRight size={15} />
          </button>
        </div>
      </section>
      {applyJob && (
        <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} />
      )}
    </>
  );
}
