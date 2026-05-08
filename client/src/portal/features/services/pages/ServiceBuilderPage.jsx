import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import PageHeader from "../../../shared/ui/PageHeader";
import { useToast } from "../../../shared/ui/Toast";
import ConfirmModal from "../../../shared/ui/ConfirmModal";

import { ArrowLeft, CheckCircle2 } from "lucide-react";

import {
  getServiceTemplate,
  uploadServiceTemplateFiles,
  createServiceTemplate,
  updateServiceTemplate,
} from "../api";
import { DEFAULT_TEMPLATE } from "../constants";

import ServiceTemplateTabs from "../tabs/ServiceTemplateTabs";
import ServiceTemplateOverview from "../tabs/ServiceTemplateOverview";
import ServiceTemplateScope from "../tabs/ServiceTemplateScope";
import ServiceTemplateSLA from "../tabs/ServiceTemplateSLA";
import ServiceTemplateApprovals from "../tabs/ServiceTemplateApprovals";
import ServiceTemplateFiles from "../tabs/ServiceTemplateFiles";
import ServiceTemplatePreview from "../tabs/ServiceTemplatePreview";

function MetaPill({ label, value, tone = "default" }) {
  const tones = {
    default: "border-slate-200 bg-white text-slate-700",
    brand: "border-indigo-200 bg-indigo-50 text-indigo-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <div
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-extrabold",
        tones[tone] || tones.default,
      ].join(" ")}
    >
      <span className="text-slate-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function countJobs(scopeGroups = []) {
  return scopeGroups.reduce((sum, group) => {
    const jobs = Array.isArray(group?.jobs) ? group.jobs : [];
    return (
      sum +
      jobs.reduce(
        (jobSum, job) => jobSum + Math.max(1, Number(job?.quantity || 1)),
        0
      )
    );
  }, 0);
}

export default function ServiceBuilderPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const isEdit = Boolean(id);

  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(Boolean(id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [doc, setDoc] = useState(DEFAULT_TEMPLATE);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  const summaryStats = useMemo(() => {
    const groups = Array.isArray(doc.scopeGroups) ? doc.scopeGroups : [];

    return {
      status: doc.status || "draft",
      groups: groups.length,
      jobs: countJobs(groups),
      approvalSteps: Array.isArray(doc.approvals?.steps)
        ? doc.approvals.steps.length
        : 0,
      pricing:
        typeof doc.price === "number"
          ? `${doc.price}${doc.billingCycle ? ` / ${doc.billingCycle}` : ""}`
          : "Not set",
    };
  }, [doc]);

  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  const updateDoc = useCallback((updater) => {
    setDoc((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return next;
    });
    setIsDirty(true);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const goBackSafely = () => {
    if (isDirty) {
      setConfirmState({
        title: "Unsaved changes",
        message: "You have unsaved changes. Leave this page without saving?",
        danger: false,
        onConfirm: () => {
          setConfirmState(null);
          nav("/portal/services");
        },
      });
      return;
    }
    nav("/portal/services");
  };

  const handleSave = async () => {
    setBusy(true);
    setError("");

    try {
      let res;

      const payload = {
        name: doc.name || "",
        slug: doc.slug || "",
        summary: doc.summary || "",
        description: doc.description || "",
        status: doc.status || "draft",
        billingCycle: doc.billingCycle || "",
        executionMode: doc.executionMode || "recurring",
        price:
          doc.price === "" ||
          doc.price === null ||
          typeof doc.price === "undefined"
            ? null
            : Number(doc.price),
        scopeGroups: Array.isArray(doc.scopeGroups)
          ? doc.scopeGroups.map((group, index) => ({
              id: group.id || `${index + 1}`,
              title: group.title || "",
              description: group.description || "",
              type: group.type || "deliverable_group",
              order: Number(group.order ?? index + 1),
              dueDays: Number(group.dueDays || 0),
              jobs: Array.isArray(group.jobs)
                ? group.jobs.map((job, jobIndex) => ({
                    id: job.id || `${index + 1}-${jobIndex + 1}`,
                    title: job.title || "",
                    description: job.description || "",
                    type: job.type || "task",
                    quantity: Number(job.quantity || 1),
                    unit: job.unit || "",
                    dueDays: Number(job.dueDays || 0),
                    required: job.required !== false,
                    checklist: Array.isArray(job.checklist)
                      ? job.checklist.map((c) => ({
                          text: typeof c === "string" ? c : c?.text || "",
                          required:
                            typeof c === "string"
                              ? true
                              : c?.required !== false,
                        }))
                      : [],
                  }))
                : [],
            }))
          : [],
        sla: doc.sla || {},
        approvals: doc.approvals || {},
        files: doc.files || {},
      };

      if (isEdit) {
        res = await updateServiceTemplate(id, payload);
      } else {
        res = await createServiceTemplate(payload);
      }

      const savedItem = res?.item || res?.service || null;

      if (savedItem) {
        setDoc({
          ...DEFAULT_TEMPLATE,
          ...savedItem,
          scopeGroups: Array.isArray(savedItem?.scopeGroups)
            ? savedItem.scopeGroups.map((group) => ({
                ...group,
                jobs: Array.isArray(group?.jobs)
                  ? group.jobs.map((job) => ({
                      ...job,
                      _saved: true,
                    }))
                  : [],
              }))
            : [],
          sla: { ...DEFAULT_TEMPLATE.sla, ...(savedItem?.sla || {}) },
          approvals: {
            ...DEFAULT_TEMPLATE.approvals,
            ...(savedItem?.approvals || {}),
          },
          files: { ...DEFAULT_TEMPLATE.files, ...(savedItem?.files || {}) },
        });
      }

      setIsDirty(false);

      if (!isEdit && savedItem?._id) {
        nav(`/portal/services/${savedItem._id}/edit`);
      }

      toast.success("Service template saved successfully.");
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const load = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError("");

    try {
      const res = await getServiceTemplate(id);
      const item = res?.item || res?.service || null;

      const nextDoc = {
        ...DEFAULT_TEMPLATE,
        ...item,
        scopeGroups: Array.isArray(item?.scopeGroups)
          ? item.scopeGroups.map((group) => ({
              ...group,
              jobs: Array.isArray(group?.jobs)
                ? group.jobs.map((job) => ({
                    ...job,
                    _saved: true,
                  }))
                : [],
            }))
          : [],
        sla: { ...DEFAULT_TEMPLATE.sla, ...(item?.sla || {}) },
        approvals: {
          ...DEFAULT_TEMPLATE.approvals,
          ...(item?.approvals || {}),
        },
        files: { ...DEFAULT_TEMPLATE.files, ...(item?.files || {}) },
      };

      setDoc(nextDoc);
      setIsDirty(false);
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to load template"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const uploadFiles = async (files) => {
    if (!id) {
      toast.error("Save first before uploading files.");
      return;
    }

    setBusy(true);
    try {
      const res = await uploadServiceTemplateFiles(id, files);
      const nextFiles = res?.item?.files || res?.files || null;

      if (nextFiles) {
        setDoc((prev) => ({
          ...prev,
          files: { ...prev.files, ...nextFiles },
        }));
        markDirty();
      }

      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="grid gap-3">
          <Skeleton className="h-6 w-72" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-5">
      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        danger={confirmState?.danger}
        onConfirm={confirmState?.onConfirm}
        onClose={() => setConfirmState(null)}
      />
      <PageHeader
        eyebrow="CATALOG"
        title={isEdit ? "Edit Service Template" : "New Service Template"}
        subtitle="Create a reusable service blueprint for scope, delivery, SLA, and approvals."
        breadcrumb={[
          { label: "Portal", to: "/portal" },
          { label: "Services", to: "/portal/services" },
          { label: isEdit ? "Edit Template" : "New Template" },
        ]}
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={goBackSafely}>
              <ArrowLeft size={16} />
              Back
            </Button>

            <Button
              variant="outline"
              onClick={() => setTab("preview")}
              disabled={busy}
            >
              <CheckCircle2 size={16} />
              Preview
            </Button>

            <Button onClick={handleSave} disabled={busy}>
              {busy ? "Saving..." : "Save template"}
            </Button>
          </div>
        }
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-extrabold text-red-700">
          {error}
        </div>
      ) : null}

      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-900">
              {doc.name || "Untitled template"}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              {doc.summary ||
                "Add a short summary to describe this service template."}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <MetaPill label="Status" value={summaryStats.status} tone="brand" />
            <MetaPill label="Groups" value={summaryStats.groups} tone="green" />
            <MetaPill label="Jobs" value={summaryStats.jobs} tone="green" />
            <MetaPill
              label="Approvals"
              value={summaryStats.approvalSteps}
              tone="amber"
            />
            <MetaPill label="Pricing" value={summaryStats.pricing} />
          </div>
        </div>
      </Card>

      <Card className="p-3">
        <ServiceTemplateTabs value={tab} onChange={setTab} />
      </Card>

      {tab === "overview" ? (
        <ServiceTemplateOverview value={doc} onChange={updateDoc} />
      ) : null}

      {tab === "scope" ? (
        <ServiceTemplateScope
          value={doc.scopeGroups}
          executionMode={doc.executionMode}
          onChange={(scopeGroups) => {
            setDoc((s) => ({ ...s, scopeGroups }));
            setIsDirty(true);
          }}
        />
      ) : null}

      {tab === "sla" ? (
        <ServiceTemplateSLA
          value={doc.sla}
          onChange={(sla) => updateDoc((prev) => ({ ...prev, sla }))}
        />
      ) : null}

      {tab === "approvals" ? (
        <ServiceTemplateApprovals
          value={doc.approvals}
          onChange={(approvals) =>
            updateDoc((prev) => ({ ...prev, approvals }))
          }
        />
      ) : null}

      {tab === "files" ? (
        <ServiceTemplateFiles
          value={doc.files}
          onChange={(files) => updateDoc((prev) => ({ ...prev, files }))}
          onUploadFiles={uploadFiles}
        />
      ) : null}

      {tab === "preview" ? <ServiceTemplatePreview value={doc} /> : null}
    </div>
  );
}
