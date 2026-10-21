import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import Button from "./Button";

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Confirmation dialog (PUI-2). An alertdialog: focus moves to the safe
// choice (Cancel), Tab stays inside, Escape and the backdrop cancel, and
// focus returns to whatever opened it. While the action runs, both buttons
// are disabled and the confirm button shows progress.
export default function ConfirmDialog({
  open,
  title,
  children,
  details,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "warn",
  icon: Icon = AlertTriangle,
  danger = false,
  onConfirm,
  onClose,
}) {
  const id = useId();
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const returnRef = useRef(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    returnRef.current = document.activeElement;
    cancelRef.current?.focus();
    return () => {
      const el = returnRef.current;
      if (el && el.isConnected && typeof el.focus === "function") el.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) setBusy(false);
  }, [open]);

  if (!open) return null;

  const cancel = () => {
    if (!busy) onClose?.();
  };

  const confirm = async () => {
    if (!onConfirm) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      cancel();
      return;
    }
    if (e.key !== "Tab") return;
    const nodes = [...(dialogRef.current?.querySelectorAll(FOCUSABLE) || [])];
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const dialog = (
    <div className="px-dialog-scrim" onMouseDown={cancel}>
      <div
        ref={dialogRef}
        className="px-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-t`}
        aria-describedby={`${id}-d`}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="px-dialog-body">
          <span className="px-glyph" data-tone={tone} aria-hidden="true">
            <Icon size={20} />
          </span>
          <h2 id={`${id}-t`}>{title}</h2>
          <div id={`${id}-d`} style={{ display: "grid", gap: 10 }}>
            {typeof children === "string" ? <p>{children}</p> : children}
            {details?.length ? (
              <ul>
                {details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
        <div className="px-dialog-foot">
          <Button ref={cancelRef} variant="outline" onClick={cancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={confirm} loading={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(dialog, document.body) : dialog;
}
