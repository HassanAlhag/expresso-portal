import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Ban, Building2, CheckCircle2, FilePlus2, Flag, Hash, Pencil, RefreshCw, Send, Store, Tag, Trash2 } from "lucide-react";

import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import { usePageCrumbs } from "../../../layouts/ShellContext";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import Panel from "../../../shared/ui/Panel";
import KeyValue from "../../../shared/ui/KeyValue";
import Timeline from "../../../shared/ui/Timeline";
import RowActions from "../../../shared/ui/RowActions";
import LoadingState from "../../../shared/ui/LoadingState";
import ErrorState from "../../../shared/ui/ErrorState";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import FormDialog from "../../../shared/ui/FormDialog";
import SelectField from "../../../shared/ui/SelectField";

import { createRfqFromRequest, deleteRequest, getRequest, updateRequest } from "../api";
import { PRIORITY_LABEL, PRIORITY_TONE, REQUEST_STATUSES, REQUEST_STATUS_LABEL, REQUEST_STATUS_TONE, REQUEST_DELETE_DETAILS, REQUEST_TIMELINE, clientName, date, idOf, money, options, requestRef } from "../format";
import RequestFormDialog from "../components/RequestFormDialog";
import SourcingDialog from "../components/SourcingDialog";

// Procurement request (PUI-4). Everyone with access reads it; client users
// can edit their own request's details. Status, sourcing and RFQ creation
// are staff actions (the API ignores them from client users).
export default function ProcurementRequestDetailsPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("procurement.write");
  const staff = access.isInternal && canWrite;
  const canDelete = access.can("procurement.delete");

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [dialog, setDialog] = useState(null); // edit | sourcing | status | cancel | rfq | delete
  const [nextStatus, setNextStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const running = useRef(false);

  usePageCrumbs(item ? [{ label: "Procurement", to: "/portal/procurement" }, { label: "Requests", to: "/portal/procurement/requests" }, { label: requestRef(item) || "Request" }] : []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getRequest(id);
      setItem(res?.item || null);
      if (!res?.item) setLoadError({ status: 404 });
    } catch (e) {
      setLoadError({ status: e?.response?.status, message: e?.response?.data?.message });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !item) return <LoadingState rows={6} label="Loading request" />;
  if (loadError || !item) {
    const s = loadError?.status;
    return (
      <ErrorState
        title={s === 404 ? "Request not found" : s === 403 ? "You don't have access to this request" : "This request didn't load"}
        message={s === 404 ? "It may have been deleted, or the link is wrong." : s === 403 ? "It belongs to another company." : loadError?.message || undefined}
        onRetry={s === 404 || s === 403 ? undefined : load}
      />
    );
  }

  const open = (kind) => {
    setFormError("");
    if (kind === "status") setNextStatus(item.status);
    setDialog(kind);
  };
  const close = () => setDialog(null);

  const guarded = async (fn) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setFormError("");
    try {
      await fn();
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  const patch = (payload, done) =>
    guarded(async () => {
      try {
        const res = await updateRequest(item._id, payload);
        if (res?.item) setItem(res.item);
        else await load();
        toast.success(done);
        close();
      } catch (e) {
        const msg = e?.response?.data?.message || "That wasn't saved. Try again.";
        if (["edit", "sourcing", "status"].includes(dialog)) setFormError(msg);
        else toast.error(msg);
      }
    });

  const createRfq = () =>
    guarded(async () => {
      try {
        const res = await createRfqFromRequest(item._id);
        toast.success("Draft RFQ created. The request is now Assessing.");
        close();
        nav(res?.item?._id ? `/portal/procurement/rfqs/${res.item._id}` : "/portal/procurement/rfqs");
      } catch (e) {
        const existing = e?.response?.data?.item;
        close();
        if (existing?._id) {
          toast.info("This request already has an RFQ. Opening it.");
          nav(`/portal/procurement/rfqs/${existing._id}`);
        } else toast.error(e?.response?.data?.message || "The RFQ wasn't created. Try again.");
      }
    });

  const remove = async () => {
    try {
      await deleteRequest(item._id);
      toast.success("Request deleted.");
      nav("/portal/procurement/requests");
    } catch (e) {
      toast.error(e?.response?.data?.message || "The request wasn't deleted. Try again.");
    }
  };

  const client = item.customerId && typeof item.customerId === "object" ? item.customerId : null;
  const vendor = item.vendorId && typeof item.vendorId === "object" ? item.vendorId : null;
  const tl = item.timeline || {};
  const history = [
    { key: "created", icon: Send, content: <>Created{item.createdBy?.fullName ? ` by ${item.createdBy.fullName}` : ""}</>, when: date(item.createdAt), dateTime: item.createdAt },
    ...REQUEST_TIMELINE.filter((s) => tl[s.field]).map((s) => ({ key: s.status, icon: s.status === "cancelled" ? Ban : CheckCircle2, tone: s.status === "cancelled" ? "idle" : s.status === "delivered" ? "ok" : undefined, content: <>{s.label}</>, when: date(tl[s.field]), dateTime: tl[s.field] })),
  ].sort((a, b) => new Date(a.dateTime || 0) - new Date(b.dateTime || 0));

  const deletable = canDelete && ["new", "cancelled"].includes(item.status);
  const menu = [
    { key: "refresh", label: "Refresh", icon: RefreshCw, onSelect: () => load() },
    staff ? { key: "status", label: "Change status", icon: Flag, onSelect: () => open("status") } : null,
    staff ? { key: "sourcing", label: "Edit sourcing", icon: Store, onSelect: () => open("sourcing") } : null,
    staff && item.status !== "cancelled" ? { key: "sep1", separator: true } : null,
    staff && item.status !== "cancelled" ? { key: "cancel", label: "Cancel request", icon: Ban, tone: "muted", onSelect: () => open("cancel") } : null,
    deletable ? { key: "delete", label: "Delete request", icon: Trash2, tone: "muted", onSelect: () => open("delete") } : null,
  ];

  return (
    <>
      <div className="px-stack" style={{ gap: 20 }}>
        <header className="px-record-head">
          <div className="px-record-id">
            <div className="px-record-tags">
              <Badge tone={REQUEST_STATUS_TONE[item.status] || "neutral"} dot>{REQUEST_STATUS_LABEL[item.status] || item.status}</Badge>
              <Badge tone={PRIORITY_TONE[item.priority] || "neutral"}>{`${PRIORITY_LABEL[item.priority] || "Normal"} priority`}</Badge>
              <span className="px-code">{requestRef(item)}</span>
            </div>
            <h1>{item.title || "Untitled request"}</h1>
            <ul className="px-record-meta" aria-label="Request summary">
              {access.isInternal && client ? (
                <li>
                  <Building2 size={15} aria-hidden="true" />
                  {access.canOpen("/portal/customers") ? <Link to={`/portal/customers/${idOf(client)}`}>{clientName(item)}</Link> : clientName(item)}
                </li>
              ) : null}
              {item.categoryId?.name ? (
                <li>
                  <Tag size={15} aria-hidden="true" />
                  {item.categoryId.name}
                </li>
              ) : null}
              <li>
                <Hash size={15} aria-hidden="true" />
                Created {date(item.createdAt)}
              </li>
            </ul>
          </div>
          <div className="px-record-actions">
            {canWrite ? (
              <Button variant="outline" onClick={() => open("edit")}>
                <Pencil size={15} aria-hidden="true" />
                Edit
              </Button>
            ) : null}
            {staff && !["cancelled", "delivered"].includes(item.status) ? (
              <Button onClick={() => open("rfq")}>
                <FilePlus2 size={15} aria-hidden="true" />
                Create RFQ
              </Button>
            ) : null}
            <RowActions label={item.title || "request"} actions={menu} />
          </div>
        </header>

        <div className="px-grid px-cols-detail">
          <div className="px-stack">
            <Panel title="What's needed">
              <KeyValue
                items={[
                  { label: "Description", value: item.description ? <span style={{ whiteSpace: "pre-wrap" }}>{item.description}</span> : "" },
                  { label: "Requirements", value: item.requirements ? <span style={{ whiteSpace: "pre-wrap" }}>{item.requirements}</span> : "" },
                  { label: "Budget", value: item.budget ? money(item.budget, item.currency) : "" },
                ]}
              />
            </Panel>
            <Panel title="History">
              <Timeline label="Request history" items={history} />
            </Panel>
          </div>
          <div className="px-stack">
            <Panel title="Sourcing" sub={access.isInternal ? "Internal fields marked below" : undefined} action={staff ? <Button size="sm" variant="outline" onClick={() => open("sourcing")}>Edit</Button> : null}>
              <KeyValue
                className="px-kv--side"
                items={[
                  { label: "Vendor", value: vendor?.name || (access.isInternal ? "Not chosen" : "") },
                  { label: "Quoted", value: item.quotedAmount !== null && item.quotedAmount !== undefined ? money(item.quotedAmount, item.currency) : "" },
                  { label: "Proposed delivery", value: date(item.proposedDelivery) },
                  { label: "Assigned to (internal)", value: item.assignedTo?.fullName || item.assignedTo?.email || "Nobody", hidden: !access.isInternal },
                ]}
              />
            </Panel>
            {access.isInternal && item.notes ? (
              <Panel title="Internal notes" sub="Not shown to the client">
                <p className="px-prose" style={{ whiteSpace: "pre-wrap" }}>{item.notes}</p>
              </Panel>
            ) : null}
          </div>
        </div>
      </div>

      {canWrite ? <RequestFormDialog open={dialog === "edit"} initial={item} busy={busy} error={formError} onClose={close} onSubmit={(p) => patch(p, "Request updated.")} /> : null}
      {staff ? (
        <>
          <SourcingDialog open={dialog === "sourcing"} request={item} busy={busy} error={formError} onClose={close} onSubmit={(p) => patch(p, "Sourcing details saved.")} />
          <FormDialog
            open={dialog === "status"}
            title="Change status"
            description="The date of each status is recorded in the request's history. Any status can be set, as before."
            onClose={close}
            onSubmit={() => patch({ status: nextStatus }, `Status changed to ${REQUEST_STATUS_LABEL[nextStatus]}.`)}
            busy={busy}
            error={formError}
            canSubmit={nextStatus && nextStatus !== item.status}
            submitLabel="Change status"
            submitIcon={Flag}
          >
            <fieldset className="px-form-section">
              <legend>Status</legend>
              <SelectField label="New status" value={nextStatus} onChange={setNextStatus} options={options(REQUEST_STATUSES, REQUEST_STATUS_LABEL)} />
            </fieldset>
          </FormDialog>
          <ConfirmDialog open={dialog === "cancel"} icon={Ban} tone="warn" title="Cancel this request?" confirmLabel="Cancel request" details={["Its status becomes Cancelled and the date is recorded. The request is kept.", "A cancelled request can be deleted afterwards."]} onClose={close} onConfirm={() => patch({ status: "cancelled" }, "Request cancelled.")}>
            {`${item.title} (${requestRef(item)}).`}
          </ConfirmDialog>
          <ConfirmDialog
            open={dialog === "rfq"}
            icon={FilePlus2}
            tone="info"
            title="Create an RFQ from this request?"
            confirmLabel="Create draft RFQ"
            details={["A draft RFQ is created with the request's title, description, requirements and category, and the next RFQ number.", "The budget stays internal and is not copied into the RFQ.", "The request's status becomes Assessing. Each request can have one RFQ."]}
            onClose={close}
            onConfirm={createRfq}
          >
            {`${item.title} (${requestRef(item)}).`}
          </ConfirmDialog>
        </>
      ) : null}
      <ConfirmDialog open={dialog === "delete"} icon={Trash2} tone="bad" danger title="Delete this request?" confirmLabel="Delete request" details={REQUEST_DELETE_DETAILS} onClose={close} onConfirm={remove}>
        {`${item.title} (${requestRef(item)}).`}
      </ConfirmDialog>
    </>
  );
}
