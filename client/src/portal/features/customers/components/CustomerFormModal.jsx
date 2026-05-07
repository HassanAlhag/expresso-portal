import React, { useEffect, useMemo, useState } from "react";
import Button from "../../../shared/ui/Button";
import {
  Building2,
  X,
  Image as ImageIcon,
  Trash2,
  Briefcase,
  ShoppingCart,
  Layers,
  Phone,
  Mail,
  Globe,
  Hash,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";
import MediaPickerModal from "../../media-library/components/MediaPickerModal";
import { getAssetUrl } from "../../../shared/utils/assetUrl";

const DEPT_OPTIONS = [
  {
    value: "digital_agency",
    label: "Digital Agency",
    icon: Briefcase,
    color: "indigo",
    desc: "Web, social, content, production",
  },
  {
    value: "procurement",
    label: "Procurement",
    icon: ShoppingCart,
    color: "emerald",
    desc: "Supply, sourcing, purchasing",
  },
  {
    value: "both",
    label: "Both",
    icon: Layers,
    color: "violet",
    desc: "Agency + procurement services",
  },
];

const DEPT_COLORS = {
  indigo: {
    ring: "ring-indigo-400 border-indigo-300 bg-indigo-50",
    text: "text-indigo-700",
    icon: "text-indigo-500",
  },
  emerald: {
    ring: "ring-emerald-400 border-emerald-300 bg-emerald-50",
    text: "text-emerald-700",
    icon: "text-emerald-500",
  },
  violet: {
    ring: "ring-violet-400 border-violet-300 bg-violet-50",
    text: "text-violet-700",
    icon: "text-violet-500",
  },
};

function SectionLabel({ children }) {
  return (
    <div className="text-[10px] font-black tracking-[0.24em] text-slate-400 mb-3 uppercase">
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-[11px] font-black tracking-[0.18em] text-slate-500 uppercase">
        {label}
      </label>
      {children}
      {hint && <div className="text-[11px] text-slate-400">{hint}</div>}
    </div>
  );
}

export default function CustomerFormModal({
  open,
  mode = "create",
  initial = null,
  onClose,
  onSubmit,
  busy,
}) {
  const isEdit = mode === "edit";

  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [contactName, setContactName] = useState("");
  const [primaryEmail, setPrimaryEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [code, setCode] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [department, setDepartment] = useState("digital_agency");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoMediaId, setLogoMediaId] = useState("");
  const [logoPickerOpen, setLogoPickerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const c = initial || {};
    setCompanyName(c.companyName || "");
    setSlug(c.slug || "");
    setContactName(c.contactName || "");
    setPrimaryEmail(c.primaryEmail || "");
    setPhone(c.phone || "");
    setIndustry(c.industry || "");
    setCountry(c.country || "");
    setCode(c.code || "");
    setNotes(c.notes || "");
    setIsActive(typeof c.isActive === "boolean" ? c.isActive : true);
    setDepartment(c.department || "digital_agency");
    setLogoUrl(c.logoUrl || "");
    setLogoMediaId(c.logoMediaId || "");
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const canSubmit = useMemo(
    () => Boolean(companyName.trim()) && Boolean(contactName.trim()),
    [companyName, contactName]
  );

  const payload = () => ({
    companyName: companyName.trim(),
    slug: slug.trim() || undefined,
    contactName: contactName.trim() || undefined,
    primaryEmail: primaryEmail.trim() || undefined,
    phone: phone.trim() || undefined,
    industry: industry.trim() || undefined,
    country: country.trim() || undefined,
    code: code.trim() || undefined,
    notes: notes.trim() || undefined,
    isActive: Boolean(isActive),
    department,
    logoUrl: logoUrl || undefined,
    logoMediaId: logoMediaId || undefined,
  });

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onMouseDown={() => onClose?.()}
      >
        <div
          className="flex w-full max-w-4xl max-h-[92vh] flex-col overflow-hidden rounded-[32px] border border-black/[0.07] bg-white shadow-2xl"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="shrink-0 flex items-center justify-between gap-4 border-b border-black/[0.06] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-black/[0.08] bg-slate-50">
                <Building2 size={18} className="text-slate-700" />
              </div>
              <div>
                <div className="text-lg font-black text-slate-900 leading-none">
                  {isEdit ? "Edit Client" : "New Client"}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {isEdit
                    ? "Update profile, contact, and settings"
                    : "Add a new client to your workspace"}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full border border-black/[0.08] bg-white text-slate-500 transition hover:bg-slate-50"
              onClick={() => onClose?.()}
            >
              <X size={16} />
            </button>
          </div>

          {/* ── Body ───────────────────────────────────────────────────── */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid gap-0 divide-y divide-black/[0.05]">
              {/* Department */}
              <div className="px-6 py-5">
                <SectionLabel>Department</SectionLabel>
                <div className="grid gap-2 sm:grid-cols-3">
                  {DEPT_OPTIONS.map(
                    ({ value, label, icon: Icon, color, desc }) => {
                      const sel = department === value;
                      const c = DEPT_COLORS[color];
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setDepartment(value)}
                          className={[
                            "flex items-start gap-3 rounded-2xl border p-3.5 text-left transition",
                            sel
                              ? `ring-2 ${c.ring}`
                              : "border-black/[0.07] bg-white hover:bg-slate-50",
                          ].join(" ")}
                        >
                          <div
                            className={[
                              "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border",
                              sel
                                ? `border-current ${c.ring}`
                                : "border-black/[0.07] bg-slate-50",
                            ].join(" ")}
                          >
                            <Icon
                              size={15}
                              className={sel ? c.icon : "text-slate-400"}
                            />
                          </div>
                          <div className="min-w-0">
                            <div
                              className={[
                                "text-sm font-black",
                                sel ? c.text : "text-slate-700",
                              ].join(" ")}
                            >
                              {label}
                            </div>
                            <div className="mt-0.5 text-[11px] text-slate-400 leading-snug">
                              {desc}
                            </div>
                          </div>
                          {sel && (
                            <CheckCircle
                              size={14}
                              className={[
                                "ml-auto shrink-0 mt-0.5",
                                c.icon,
                              ].join(" ")}
                            />
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Logo + Identity */}
              <div className="px-6 py-5">
                <SectionLabel>Identity</SectionLabel>
                <div className="grid gap-5 md:grid-cols-[180px_1fr]">
                  {/* Logo preview */}
                  <div className="flex flex-col gap-2">
                    <div className="flex h-36 items-center justify-center overflow-hidden rounded-[20px] border border-black/[0.07] bg-slate-50">
                      {logoUrl ? (
                        <img
                          src={getAssetUrl(logoUrl)}
                          alt={companyName || "Logo"}
                          className="h-full w-full object-contain p-3"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-slate-300">
                          <ImageIcon size={28} strokeWidth={1.5} />
                          <div className="text-xs text-slate-400">No logo</div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => setLogoPickerOpen(true)}
                      >
                        <ImageIcon size={12} /> Upload
                      </Button>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setLogoUrl("");
                            setLogoMediaId("");
                          }}
                          className="grid h-8 w-8 place-items-center rounded-xl border border-black/[0.08] bg-white text-slate-400 hover:text-rose-500 transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Company name + slug + status */}
                  <div className="grid content-start gap-3">
                    <Field label="Company name *">
                      <input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Al Futtaim Group"
                        className="h-11 w-full rounded-2xl border border-black/[0.09] bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:ring-4 focus:ring-black/[0.04]"
                      />
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Client code" hint="e.g. EXP-001">
                        <div className="relative">
                          <Hash
                            size={13}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="EXP-001"
                            className="h-11 w-full rounded-2xl border border-black/[0.09] bg-white pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-black/[0.04]"
                          />
                        </div>
                      </Field>
                      <Field label="Status">
                        <button
                          type="button"
                          onClick={() => setIsActive((v) => !v)}
                          className={[
                            "flex h-11 w-full items-center gap-2 rounded-2xl border px-4 text-sm font-black transition",
                            isActive
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border-rose-200 bg-rose-50 text-rose-800",
                          ].join(" ")}
                        >
                          {isActive ? (
                            <CheckCircle
                              size={15}
                              className="text-emerald-500"
                            />
                          ) : (
                            <XCircle size={15} className="text-rose-400" />
                          )}
                          {isActive ? "Active" : "Inactive"}
                          <span className="ml-auto text-[10px] font-medium opacity-60">
                            click to toggle
                          </span>
                        </button>
                      </Field>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="px-6 py-5">
                <SectionLabel>Contact</SectionLabel>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Contact person *">
                    <input
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Full name"
                      className="h-11 w-full rounded-2xl border border-black/[0.09] bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-black/[0.04]"
                    />
                  </Field>
                  <Field label="Email">
                    <div className="relative">
                      <Mail
                        size={13}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        value={primaryEmail}
                        onChange={(e) => setPrimaryEmail(e.target.value)}
                        placeholder="name@company.com"
                        type="email"
                        className="h-11 w-full rounded-2xl border border-black/[0.09] bg-white pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-black/[0.04]"
                      />
                    </div>
                  </Field>
                  <Field label="Phone">
                    <div className="relative">
                      <Phone
                        size={13}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+971 …"
                        className="h-11 w-full rounded-2xl border border-black/[0.09] bg-white pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-black/[0.04]"
                      />
                    </div>
                  </Field>
                  <Field label="Industry">
                    <input
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="Real Estate, Healthcare…"
                      className="h-11 w-full rounded-2xl border border-black/[0.09] bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-black/[0.04]"
                    />
                  </Field>
                  <Field label="Country">
                    <div className="relative">
                      <Globe
                        size={13}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="UAE"
                        className="h-11 w-full rounded-2xl border border-black/[0.09] bg-white pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-black/[0.04]"
                      />
                    </div>
                  </Field>
                  <Field label="Slug" hint="Auto-generated if left empty">
                    <input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="al-futtaim"
                      className="h-11 w-full rounded-2xl border border-black/[0.09] bg-white px-4 font-mono text-sm text-slate-700 outline-none transition placeholder:font-sans placeholder:text-slate-400 focus:ring-4 focus:ring-black/[0.04]"
                    />
                  </Field>
                </div>
              </div>

              {/* Notes */}
              <div className="px-6 py-5">
                <SectionLabel>Internal notes</SectionLabel>
                <div className="relative">
                  <FileText
                    size={13}
                    className="absolute left-3.5 top-3.5 text-slate-400"
                  />
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Payment terms, SLA, account manager notes…"
                    className="w-full rounded-2xl border border-black/[0.09] bg-white pl-9 pr-4 pt-3 pb-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-black/[0.04] resize-none"
                  />
                </div>
                <div className="mt-1.5 text-[11px] text-slate-400">
                  Internal only — not visible to the client.
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ─────────────────────────────────────────────────── */}
          <div className="shrink-0 flex items-center justify-between gap-3 border-t border-black/[0.06] bg-slate-50/70 px-6 py-4">
            <div className="text-xs text-slate-400">
              {canSubmit ? (
                <span className="text-emerald-600 font-semibold">
                  ✓ Ready to {isEdit ? "save" : "create"}
                </span>
              ) : (
                "Company name and contact person are required"
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => onClose?.()}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                onClick={() => onSubmit?.(payload())}
                disabled={busy || !canSubmit}
              >
                {isEdit ? "Save changes" : "Create client"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <MediaPickerModal
        open={logoPickerOpen}
        onClose={() => setLogoPickerOpen(false)}
        title="Select Client Logo"
        subtitle="Choose from media library or upload a new file."
        onlyType="image"
        multiple={false}
        allowUpload={true}
        onSelect={(item) => {
          if (!item) return;
          setLogoUrl(item.url || item.thumbnailUrl || "");
          setLogoMediaId(item._id || "");
        }}
      />
    </>
  );
}
