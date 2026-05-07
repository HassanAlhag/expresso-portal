import React, { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import Button from "./Button";

export default function ConfirmModal({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onClose,
}) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    if (!onConfirm) return;
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  const Icon = danger ? Trash2 : AlertTriangle;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={() => !loading && onClose?.()}
    >
      <div
        className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 px-6 pt-6 pb-4">
          <div
            className={[
              "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
              danger ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-500",
            ].join(" ")}
          >
            <Icon size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black text-slate-900">{title}</h2>
            {message && (
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            size="sm"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Please wait…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
