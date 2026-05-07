import React, { useEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import Button from "./Button";

export default function PromptModal({
  open,
  title = "Add a note",
  message,
  inputLabel,
  inputType = "text",
  inputPlaceholder = "",
  inputDefault = "",
  required = false,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
}) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setValue(inputDefault || "");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, inputDefault]);

  if (!open) return null;

  const canConfirm = !required || value.trim().length > 0;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setLoading(true);
    try {
      await onConfirm?.(value.trim());
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && inputType !== "textarea") handleConfirm();
    if (e.key === "Escape") onClose?.();
  };

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
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
            <MessageSquare size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black text-slate-900">{title}</h2>
            {message && (
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{message}</p>
            )}
          </div>
        </div>

        <div className="px-6 pb-4">
          {inputLabel && (
            <div className="mb-2 text-[11px] font-extrabold tracking-[0.22em] text-slate-500">
              {inputLabel}
            </div>
          )}
          {inputType === "textarea" ? (
            <textarea
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKey}
              rows={3}
              placeholder={inputPlaceholder}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          ) : (
            <input
              ref={inputRef}
              type={inputType}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKey}
              placeholder={inputPlaceholder}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={loading || !canConfirm}
          >
            {loading ? "Please wait…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
