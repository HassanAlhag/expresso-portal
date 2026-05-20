import React from "react";
import { X } from "lucide-react";

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = "760px",
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onMouseDown={() => onClose?.()}
    >
      <div
        className="flex w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl"
        style={{
          width: `min(${width}, 100%)`,
          maxHeight: "calc(100dvh - env(safe-area-inset-top, 20px) - 20px)",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            {title ? (
              <h2 className="text-lg font-black text-slate-900">{title}</h2>
            ) : null}

            {subtitle ? (
              <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => onClose?.()}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>

        {footer ? (
          <div
            className="flex-shrink-0 border-t border-slate-100 px-5 py-4 sm:px-6"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
          >{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
