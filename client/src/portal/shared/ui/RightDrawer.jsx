import React, { useEffect } from "react";
import { X } from "lucide-react";

export default function RightDrawer({
  open,
  title,
  subtitle,
  onClose,
  children,
  right,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999]" onMouseDown={onClose}>
      <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm" />

      <div
        className="absolute right-0 top-0 h-full w-[min(560px,94vw)] bg-white border-l border-slate-200 shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-lg font-black text-slate-900 truncate">
                {title}
              </div>
              {subtitle ? (
                <div className="mt-1 text-sm text-slate-500 truncate">
                  {subtitle}
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              {right ? <div>{right}</div> : null}
              <button
                className="h-10 w-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50"
                onClick={onClose}
                title="Close"
              >
                <X className="mx-auto" size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 overflow-y-auto h-[calc(100%-76px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
