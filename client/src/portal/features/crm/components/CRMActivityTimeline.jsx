import React from "react";
import {
  Phone, Mail, Users, StickyNote, CheckSquare,
  MessageCircle, MoreHorizontal, Trash2,
} from "lucide-react";
import { deleteActivity } from "../api";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import { useToast } from "../../../shared/ui/Toast";

const TYPE_META = {
  call:     { Icon: Phone,          bg: "bg-sky-50",     border: "border-sky-200",     text: "text-sky-700",     label: "Call" },
  email:    { Icon: Mail,           bg: "bg-violet-50",  border: "border-violet-200",  text: "text-violet-700",  label: "Email" },
  meeting:  { Icon: Users,          bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   label: "Meeting" },
  note:     { Icon: StickyNote,     bg: "bg-slate-50",   border: "border-slate-200",   text: "text-slate-700",   label: "Note" },
  task:     { Icon: CheckSquare,    bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", label: "Task" },
  whatsapp: { Icon: MessageCircle,  bg: "bg-green-50",   border: "border-green-200",   text: "text-green-700",   label: "WhatsApp" },
  other:    { Icon: MoreHorizontal, bg: "bg-slate-50",   border: "border-slate-200",   text: "text-slate-600",   label: "Activity" },
};

function timeAgo(date) {
  const d = new Date(date);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function ActivityItem({ item, canDelete, onDeleted }) {
  const meta = TYPE_META[item.type] || TYPE_META.other;
  const { Icon } = meta;
  const toast = useToast();
  const [busy, setBusy] = React.useState(false);
  const [confirmState, setConfirmState] = React.useState(null);

  const handleDelete = () => {
    setConfirmState({
      title: "Delete activity",
      message: "Delete this activity?",
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        try {
          await deleteActivity(item._id);
          onDeleted?.(item._id);
        } catch {
          toast.error("Failed to delete activity.");
          setBusy(false);
        }
        setConfirmState(null);
      },
    });
  };

  return (
    <>
      <div className="flex gap-3">
        {/* Icon + line */}
        <div className="flex flex-col items-center">
          <div className={[
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border",
            meta.bg, meta.border,
          ].join(" ")}>
            <Icon size={14} className={meta.text} />
          </div>
          <div className="mt-1 w-px flex-1 bg-slate-100" />
        </div>

        {/* Content */}
        <div className="mb-5 min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={[
                  "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em]",
                  meta.bg, meta.border, meta.text,
                ].join(" ")}>
                  {meta.label}
                </span>
                <span className="text-xs text-slate-400">{timeAgo(item.createdAt)}</span>
                {item.createdBy?.fullName && (
                  <span className="text-xs text-slate-500">by {item.createdBy.fullName}</span>
                )}
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-900">{item.subject}</p>
              {item.body && (
                <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{item.body}</p>
              )}
              {item.outcome && (
                <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  <span className="font-black text-slate-500 mr-1">Outcome:</span>
                  {item.outcome}
                </div>
              )}
            </div>

            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="flex-shrink-0 text-slate-300 hover:text-rose-500 transition"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        danger={confirmState?.danger}
        onConfirm={confirmState?.onConfirm}
        onClose={() => setConfirmState(null)}
      />
    </>
  );
}

export default function CRMActivityTimeline({ items = [], canDelete = false, onDeleted }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center text-sm text-slate-500">
        No activities logged yet.
      </div>
    );
  }

  return (
    <div className="pt-1">
      {items.map((item) => (
        <ActivityItem
          key={item._id}
          item={item}
          canDelete={canDelete}
          onDeleted={onDeleted}
        />
      ))}
    </div>
  );
}
