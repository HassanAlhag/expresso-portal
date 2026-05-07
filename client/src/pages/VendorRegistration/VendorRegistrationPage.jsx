import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiGlobe,
  FiMapPin,
  FiGrid,
  FiCheckCircle,
  FiPlus,
  FiX,
  FiArrowLeft,
  FiArrowRight,
} from "react-icons/fi";
import { getCategoryTree, submitVendorApplication } from "../../api/vendorApplications";

const BRAND = "#6366f1";
const STEPS = ["Company Info", "Category Selection", "Review & Submit"];

const COUNTRIES = [
  "UAE", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman",
  "Jordan", "Egypt", "Lebanon", "Iraq", "Other",
];

// ── Reusable input ────────────────────────────────────────────────────────────
function Field({ label, icon: Icon, error, children }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500">
        {Icon && <Icon size={12} />}
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Input({ ...props }) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
    />
  );
}

function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
    >
      {children}
    </select>
  );
}

// ── Category picker for one slot ──────────────────────────────────────────────
function CategoryPicker({ index, tree, value, onChange, onRemove, canRemove }) {
  const mainCats = tree;
  const catLevel2 = value.mainCategoryId
    ? (mainCats.find((m) => m._id === value.mainCategoryId)?.children || [])
    : [];
  const catLevel3 = value.categoryId
    ? (catLevel2.find((c) => c._id === value.categoryId)?.children || [])
    : [];

  const mainName = mainCats.find((m) => m._id === value.mainCategoryId)?.name;
  const catName = catLevel2.find((c) => c._id === value.categoryId)?.name;
  const subName = catLevel3.find((c) => c._id === value.subcategoryId)?.name;

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-slate-500">
          Category {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-500"
          >
            <FiX size={14} />
          </button>
        )}
      </div>

      <div className="grid gap-3">
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Main Category
          </label>
          <Select
            value={value.mainCategoryId}
            onChange={(e) => onChange({ mainCategoryId: e.target.value, categoryId: "", subcategoryId: "" })}
          >
            <option value="">Select main category…</option>
            {mainCats.map((m) => (
              <option key={m._id} value={m._id}>
                {m.code} — {m.name}
              </option>
            ))}
          </Select>
        </div>

        {value.mainCategoryId && (
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Category
            </label>
            <Select
              value={value.categoryId}
              onChange={(e) => onChange({ ...value, categoryId: e.target.value, subcategoryId: "" })}
            >
              <option value="">Select category…</option>
              {catLevel2.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        {value.categoryId && (
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Subcategory
            </label>
            <Select
              value={value.subcategoryId}
              onChange={(e) => onChange({ ...value, subcategoryId: e.target.value })}
            >
              <option value="">Select subcategory…</option>
              {catLevel3.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        {value.subcategoryId && (
          <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700">
            <FiCheckCircle size={13} />
            {mainName} › {catName} › {subName}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function VendorRegistrationPage() {
  const [step, setStep] = useState(0);
  const [tree, setTree] = useState([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    country: "UAE",
    website: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const [selections, setSelections] = useState([
    { mainCategoryId: "", categoryId: "", subcategoryId: "" },
  ]);
  const [selectionErrors, setSelectionErrors] = useState("");

  useEffect(() => {
    getCategoryTree()
      .then((d) => setTree(d?.tree || []))
      .catch(() => {})
      .finally(() => setTreeLoading(false));
  }, []);

  const validateStep1 = () => {
    const errs = {};
    if (!form.companyName.trim()) errs.companyName = "Required";
    if (!form.contactName.trim()) errs.contactName = "Required";
    if (!form.email.trim()) errs.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    for (const sel of selections) {
      if (!sel.mainCategoryId || !sel.categoryId || !sel.subcategoryId) {
        setSelectionErrors("Please complete all 3 levels for each selected category.");
        return false;
      }
    }
    setSelectionErrors("");
    return true;
  };

  const handleNext = () => {
    if (step === 0 && !validateStep1()) return;
    if (step === 1 && !validateStep2()) return;
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const addSelection = () => {
    if (selections.length >= 3) return;
    setSelections((prev) => [...prev, { mainCategoryId: "", categoryId: "", subcategoryId: "" }]);
  };

  const removeSelection = (i) => {
    setSelections((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateSelection = (i, val) => {
    setSelections((prev) => prev.map((s, idx) => (idx === i ? val : s)));
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await submitVendorApplication({
        ...form,
        categorySelections: selections,
      });
      setSubmitted(true);
    } catch (e) {
      setSubmitError(
        e?.response?.data?.message || e?.message || "Submission failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-3xl border border-indigo-100 bg-white p-10 text-center shadow-xl"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50">
            <FiCheckCircle size={36} color={BRAND} />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Application Submitted</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Thank you for registering as a vendor. Our sourcing team will review your
            application and reach out with your access credentials once approved.
          </p>
          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-left">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Submitted as
            </div>
            <div className="mt-1 text-sm font-bold text-slate-800">{form.companyName}</div>
            <div className="text-xs text-slate-500">{form.email}</div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 px-4 py-16">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600 shadow-sm">
            <FiGrid size={12} />
            Vendor Portal
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Vendor Registration
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Register your company and select your specialisation categories. Our team
            will review and send you access credentials.
          </p>
        </motion.div>

        {/* Step indicators */}
        <div className="mb-8 flex items-center justify-center gap-0">
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all ${
                    i < step
                      ? "bg-indigo-500 text-white"
                      : i === step
                      ? "border-2 border-indigo-500 bg-white text-indigo-600"
                      : "border-2 border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  {i < step ? <FiCheckCircle size={14} /> : i + 1}
                </div>
                <span
                  className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${
                    i === step ? "text-indigo-600" : "text-slate-400"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mb-5 h-px w-12 flex-shrink-0 transition-all sm:w-20 ${
                    i < step ? "bg-indigo-400" : "bg-slate-200"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8"
        >

          {/* ── Step 0: Company info ── */}
          {step === 0 && (
            <div className="grid gap-5">
              <h2 className="text-lg font-black text-slate-900">Company Information</h2>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Company Name" icon={FiUser} error={formErrors.companyName}>
                  <Input
                    placeholder="Acme Technologies LLC"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  />
                </Field>
                <Field label="Contact Person" icon={FiUser} error={formErrors.contactName}>
                  <Input
                    placeholder="John Smith"
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  />
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Email Address" icon={FiMail} error={formErrors.email}>
                  <Input
                    type="email"
                    placeholder="vendor@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </Field>
                <Field label="Phone" icon={FiPhone}>
                  <Input
                    placeholder="+971 50 000 0000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Country" icon={FiMapPin}>
                  <Select
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Website" icon={FiGlobe}>
                  <Input
                    placeholder="https://company.com"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* ── Step 1: Category selection ── */}
          {step === 1 && (
            <div className="grid gap-5">
              <div>
                <h2 className="text-lg font-black text-slate-900">Category Selection</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select up to 3 categories that best describe your specialisation. Each
                  selection requires all 3 levels.
                </p>
              </div>

              {treeLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid gap-4">
                    {selections.map((sel, i) => (
                      <CategoryPicker
                        key={i}
                        index={i}
                        tree={tree}
                        value={sel}
                        onChange={(val) => updateSelection(i, val)}
                        onRemove={() => removeSelection(i)}
                        canRemove={selections.length > 1}
                      />
                    ))}
                  </div>

                  {selectionErrors && (
                    <p className="text-sm text-red-500">{selectionErrors}</p>
                  )}

                  {selections.length < 3 && (
                    <button
                      type="button"
                      onClick={addSelection}
                      className="flex items-center gap-2 rounded-xl border border-dashed border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-600 transition hover:border-indigo-400 hover:bg-indigo-100"
                    >
                      <FiPlus size={15} />
                      Add another category ({selections.length}/3)
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Step 2: Review ── */}
          {step === 2 && (
            <div className="grid gap-5">
              <h2 className="text-lg font-black text-slate-900">Review & Submit</h2>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
                  Company Details
                </div>
                <dl className="grid gap-2 sm:grid-cols-2">
                  {[
                    ["Company", form.companyName],
                    ["Contact", form.contactName],
                    ["Email", form.email],
                    ["Phone", form.phone || "—"],
                    ["Country", form.country],
                    ["Website", form.website || "—"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{k}</dt>
                      <dd className="text-sm font-semibold text-slate-800">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
                  Selected Categories
                </div>
                <div className="grid gap-2">
                  {selections.map((sel, i) => {
                    const main = tree.find((m) => m._id === sel.mainCategoryId);
                    const cat = main?.children?.find((c) => c._id === sel.categoryId);
                    const sub = cat?.children?.find((c) => c._id === sel.subcategoryId);
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
                      >
                        <FiGrid size={13} className="shrink-0 text-indigo-400" />
                        {main?.name} › {cat?.name} › {sub?.name}
                      </div>
                    );
                  })}
                </div>
              </div>

              {submitError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {submitError}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <div>
              {step > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  <FiArrowLeft size={14} />
                  Back
                </button>
              )}
            </div>

            <div>
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                >
                  Continue
                  <FiArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Submit Application"}
                  {!submitting && <FiCheckCircle size={14} />}
                </button>
              )}
            </div>
          </div>
        </motion.div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Already registered?{" "}
          <a href="/portal/login" className="font-bold text-indigo-500 hover:underline">
            Log in to your portal
          </a>
        </p>
      </div>
    </div>
  );
}
