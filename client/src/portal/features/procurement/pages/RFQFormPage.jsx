import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Plus,
  X,
  ArrowLeft,
  FileText,
  Tags,
  Paperclip,
  Calendar,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react";

import PageHeader from "../../../shared/ui/PageHeader";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import Card, { CardHeader, CardBody } from "../../../shared/ui/Card";
import Skeleton from "../../../shared/ui/Skeleton";
import { useToast } from "../../../shared/ui/Toast";
import { getCategoryTree, createRfq, updateRfq, getRfq } from "../api";

const BRAND = "#6F7FD9";

const SELECT_CLS =
  "h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50";

const LABEL_CLS =
  "text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500";

const TEXTAREA_CLS =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100";

function StepBadge({ icon: Icon, label, active, done }) {
  return (
    <div
      className={[
        "flex items-center gap-3 rounded-2xl border px-4 py-3 transition",
        active
          ? "border-indigo-200 bg-indigo-50 text-indigo-700"
          : done
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-slate-400",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          active ? "bg-indigo-100" : done ? "bg-emerald-100" : "bg-slate-100",
        ].join(" ")}
      >
        {done ? <CheckCircle size={17} /> : <Icon size={17} />}
      </span>

      <span className="text-xs font-black uppercase tracking-[0.16em]">
        {label}
      </span>
    </div>
  );
}

function FormHero({ isEdit, title, description, deadline, categoryCount }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: "rgba(111,127,217,0.18)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: "rgba(14,165,233,0.10)" }}
      />

      <div className="relative grid gap-6 p-6 lg:grid-cols-[1fr_360px] lg:p-8">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10.5px] font-black uppercase tracking-[0.22em] text-indigo-600">
              Procurement
            </span>

            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10.5px] font-black uppercase tracking-[0.18em] text-slate-600">
              {isEdit ? "Edit Draft" : "New RFQ"}
            </span>
          </div>

          <h1 className="mt-5 max-w-3xl text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
            {isEdit
              ? "Update request for quotation"
              : "Create a request for quotation"}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
            Add the scope, select the right procurement categories, and attach
            supporting documents so matched vendors can submit accurate
            quotations.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StepBadge
              icon={FileText}
              label="Details"
              active={!title.trim()}
              done={Boolean(title.trim())}
            />
            <StepBadge
              icon={Tags}
              label="Categories"
              active={Boolean(title.trim()) && categoryCount === 0}
              done={categoryCount > 0}
            />
            <StepBadge
              icon={Calendar}
              label="Deadline"
              active={Boolean(title.trim()) && categoryCount > 0 && !deadline}
              done={Boolean(deadline)}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <SummaryTile
            icon={FileText}
            label="Title"
            value={title.trim() ? "Added" : "Missing"}
            helper={title.trim() || "RFQ title is required"}
            good={Boolean(title.trim())}
          />
          <SummaryTile
            icon={Tags}
            label="Categories"
            value={categoryCount}
            helper={
              categoryCount === 1
                ? "subcategory selected"
                : "subcategories selected"
            }
            good={categoryCount > 0}
          />
          <SummaryTile
            icon={Sparkles}
            label="Description"
            value={description.trim() ? "Added" : "Optional"}
            helper={
              description.trim()
                ? "Scope details included"
                : "Add scope if available"
            }
            good={Boolean(description.trim())}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryTile({ icon: Icon, label, value, helper, good }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-[0_12px_35px_rgba(15,23,42,0.04)] backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10.5px] font-black uppercase tracking-[0.2em] text-slate-400">
            {label}
          </div>

          <div
            className={[
              "mt-1 text-lg font-black",
              good ? "text-slate-950" : "text-slate-500",
            ].join(" ")}
          >
            {value}
          </div>

          <div className="mt-0.5 truncate text-xs font-semibold text-slate-400">
            {helper}
          </div>
        </div>

        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: good
              ? "rgba(16,185,129,0.10)"
              : "rgba(111,127,217,0.10)",
            color: good ? "#10b981" : BRAND,
          }}
        >
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}

// ── Category picker ───────────────────────────────────────────────────────────

function CategoryPicker({ tree, value, onChange }) {
  const [mainId, setMainId] = useState("");
  const [catId, setCatId] = useState("");
  const [subId, setSubId] = useState("");

  const catOptions = tree.find((m) => m._id === mainId)?.children || [];
  const subOptions = catOptions.find((c) => c._id === catId)?.children || [];

  function findLabel(id) {
    for (const main of tree) {
      for (const cat of main.children || []) {
        for (const sub of cat.children || []) {
          if (sub._id === id) {
            return `${main.code} › ${cat.code} › ${sub.name}`;
          }
        }
      }
    }

    return id;
  }

  function add() {
    if (!subId || value.includes(subId)) return;

    onChange([...value, subId]);
    setSubId("");
  }

  function remove(id) {
    onChange(value.filter((v) => v !== id));
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="mb-4 flex items-start gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: "rgba(111,127,217,0.10)", color: BRAND }}
          >
            <Tags size={18} />
          </span>

          <div>
            <h3 className="text-sm font-black text-slate-900">
              Vendor matching categories
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Select one or more subcategories. The RFQ will be visible to
              vendors registered under these categories.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="grid min-w-[200px] flex-1 gap-1.5">
            <span className={LABEL_CLS}>Main Category</span>
            <select
              className={SELECT_CLS}
              value={mainId}
              onChange={(e) => {
                setMainId(e.target.value);
                setCatId("");
                setSubId("");
              }}
            >
              <option value="">Select…</option>
              {tree.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.code} — {m.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid min-w-[180px] flex-1 gap-1.5">
            <span className={LABEL_CLS}>Category</span>
            <select
              className={SELECT_CLS}
              value={catId}
              disabled={!mainId}
              onChange={(e) => {
                setCatId(e.target.value);
                setSubId("");
              }}
            >
              <option value="">Select…</option>
              {catOptions.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid min-w-[180px] flex-1 gap-1.5">
            <span className={LABEL_CLS}>Subcategory</span>
            <select
              className={SELECT_CLS}
              value={subId}
              disabled={!catId}
              onChange={(e) => setSubId(e.target.value)}
            >
              <option value="">Select…</option>
              {subOptions.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </label>

          <div className="pb-0.5">
            <Button
              variant="outline"
              disabled={!subId}
              onClick={add}
              type="button"
            >
              <Plus size={14} />
              Add
            </Button>
          </div>
        </div>
      </div>

      {value.length > 0 ? (
        <div>
          <div className={LABEL_CLS + " mb-2"}>Selected Subcategories</div>

          <div className="flex flex-wrap gap-2">
            {value.map((id) => (
              <span
                key={id}
                className="flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 py-1 pl-3 pr-2 text-xs font-bold text-indigo-700"
              >
                {findLabel(id)}

                <button
                  type="button"
                  onClick={() => remove(id)}
                  className="flex h-5 w-5 items-center justify-center rounded-full transition hover:bg-indigo-200"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Tags size={18} />
          </div>
          <p className="mt-3 text-sm font-bold text-slate-500">
            No categories selected yet.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Add at least one subcategory before creating the RFQ.
          </p>
        </div>
      )}
    </div>
  );
}

function AttachmentRow({ attachment, index, onChange, onRemove }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.03)]">
      <div className="grid gap-3 lg:grid-cols-[1fr_2fr_auto] lg:items-end">
        <label className="grid gap-1.5">
          <span className={LABEL_CLS}>File name</span>
          <input
            className={SELECT_CLS}
            placeholder="Document name"
            value={attachment.name}
            onChange={(e) => onChange(index, { name: e.target.value })}
          />
        </label>

        <label className="grid gap-1.5">
          <span className={LABEL_CLS}>URL</span>
          <input
            className={SELECT_CLS}
            placeholder="https://…"
            value={attachment.url}
            onChange={(e) => onChange(index, { url: e.target.value })}
          />
        </label>

        <Button
          variant="ghost"
          size="sm"
          type="button"
          className="text-rose-600 hover:bg-rose-50"
          onClick={() => onRemove(index)}
        >
          <X size={14} />
          Remove
        </Button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RFQFormPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const toast = useToast();

  const [tree, setTree] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [subcategoryIds, setSubcategoryIds] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState("");

  const progress = useMemo(() => {
    let score = 0;

    if (title.trim()) score += 40;
    if (subcategoryIds.length > 0) score += 40;
    if (deadline) score += 10;
    if (description.trim()) score += 10;

    return score;
  }, [title, subcategoryIds.length, deadline, description]);

  useEffect(() => {
    getCategoryTree()
      .then((res) => setTree(res.tree || []))
      .catch(() => {});

    if (isEdit) {
      setLoading(true);

      getRfq(id)
        .then((res) => {
          const r = res.item;

          setTitle(r.title || "");
          setDescription(r.description || "");
          setDeadline(r.deadline ? r.deadline.slice(0, 10) : "");
          setSubcategoryIds(
            (r.subcategoryIds || []).map((c) => String(c._id || c))
          );
          setAttachments(r.attachments || []);
        })
        .catch(() => toast.error("Failed to load RFQ"))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, toast]);

  function updateAttachment(index, patch) {
    setAttachments((prev) =>
      prev.map((item, currentIndex) =>
        currentIndex === index ? { ...item, ...patch } : item
      )
    );
  }

  function removeAttachment(index) {
    setAttachments((prev) =>
      prev.filter((_, currentIndex) => currentIndex !== index)
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (subcategoryIds.length === 0) {
      setError("Select at least one category");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        deadline: deadline || null,
        subcategoryIds,
        attachments: attachments.filter((a) => a.url.trim()),
      };

      if (isEdit) {
        await updateRfq(id, payload);
        toast.success("RFQ updated.");
      } else {
        await createRfq(payload);
        toast.success("RFQ created.");
      }

      nav("/portal/procurement/rfqs");
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to save RFQ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6">
        <PageHeader
          eyebrow="PROCUREMENT"
          title={isEdit ? "Edit RFQ" : "New RFQ"}
          subtitle={
            isEdit
              ? "Update this draft RFQ before publishing."
              : "Create a new request for quotation and match it with the right vendors."
          }
          breadcrumb={[
            { label: "Portal", to: "/portal" },
            { label: "Procurement", to: "/portal/procurement" },
            { label: "RFQs", to: "/portal/procurement/rfqs" },
            { label: isEdit ? "Edit" : "New" },
          ]}
          right={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => nav("/portal/procurement/rfqs")}
              >
                <ArrowLeft size={15} />
                Back
              </Button>

              <Button
                type="submit"
                disabled={saving}
                loading={saving}
                style={{ backgroundColor: BRAND }}
              >
                {isEdit ? "Save Changes" : "Create RFQ"}
              </Button>
            </div>
          }
        />

        <FormHero
          isEdit={isEdit}
          title={title}
          description={description}
          deadline={deadline}
          categoryCount={subcategoryIds.length}
        />

        <Card className="overflow-hidden border-slate-200/80 shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
          <CardHeader
            title="RFQ Details"
            subtitle="Start with the main request information and expected response deadline."
            right={
              <div className="hidden min-w-[150px] sm:block">
                <div className="mb-1 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  <span>Readiness</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: BRAND,
                    }}
                  />
                </div>
              </div>
            }
          />

          <CardBody className="grid gap-5">
            <Input
              label="TITLE *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Supply of Network Switches Q3-2025"
            />

            <label className="grid gap-1.5">
              <span className={LABEL_CLS}>DESCRIPTION</span>
              <textarea
                className={TEXTAREA_CLS}
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the requirements, scope, technical specifications, quantity, delivery location, and any special terms…"
              />
            </label>

            <label className="grid max-w-xs gap-1.5">
              <span className={LABEL_CLS}>DEADLINE</span>
              <input
                type="date"
                className={[SELECT_CLS, "pr-3"].join(" ")}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </label>
          </CardBody>
        </Card>

        <Card className="overflow-hidden border-slate-200/80 shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
          <CardHeader
            title="Categories *"
            subtitle="This RFQ will be visible to vendors registered in the selected subcategories."
          />

          <CardBody>
            <CategoryPicker
              tree={tree}
              value={subcategoryIds}
              onChange={setSubcategoryIds}
            />
          </CardBody>
        </Card>

        <Card className="overflow-hidden border-slate-200/80 shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
          <CardHeader
            title="Attachments"
            subtitle="Add links to technical documents, BOQ files, specifications, or reference materials."
            right={
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() =>
                  setAttachments((prev) => [...prev, { name: "", url: "" }])
                }
              >
                <Plus size={13} />
                Add file
              </Button>
            }
          />

          <CardBody>
            {attachments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-7 text-center">
                <div
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: "rgba(111,127,217,0.10)",
                    color: BRAND,
                  }}
                >
                  <Paperclip size={19} />
                </div>

                <p className="mt-3 text-sm font-bold text-slate-500">
                  No attachments added.
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  You can add document links if vendors need extra details.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {attachments.map((attachment, index) => (
                  <AttachmentRow
                    key={index}
                    attachment={attachment}
                    index={index}
                    onChange={updateAttachment}
                    onRemove={removeAttachment}
                  />
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="sticky bottom-4 z-20 flex justify-end">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-[0_18px_55px_rgba(15,23,42,0.12)] backdrop-blur">
            <Button
              variant="outline"
              type="button"
              onClick={() => nav("/portal/procurement/rfqs")}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={saving}
              loading={saving}
              style={{ backgroundColor: BRAND }}
            >
              {isEdit ? "Save Changes" : "Create RFQ"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
