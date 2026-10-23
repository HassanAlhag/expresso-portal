import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Button from "./Button";
import IconButton from "./IconButton";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Form dialog (PUI-3). The shell for create/edit forms, matching the PUI-2
// project form: a labelled dialog that moves focus to the first field, keeps
// Tab inside, closes with Escape or the backdrop (not while saving), returns
// focus to what opened it, and submits with Enter. On phones it becomes a
// bottom sheet. ConfirmDialog stays the pattern for yes/no decisions.
export default function FormDialog({
  open,
  title,
  description,
  onClose,
  onSubmit,
  busy = false,
  canSubmit = true,
  submitLabel = "Save",
  submitIcon: SubmitIcon,
  cancelLabel = "Cancel",
  error,
  children,
}) {
  const id = useId();
  const dialogRef = useRef(null);
  const returnRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    returnRef.current = document.activeElement;
    const t = setTimeout(() => {
      const first = dialogRef.current?.querySelector(`.px-form-body ${FOCUSABLE}`);
      (first || dialogRef.current)?.focus();
    }, 0);
    return () => {
      clearTimeout(t);
      const el = returnRef.current;
      if (el && el.isConnected && typeof el.focus === "function") el.focus();
    };
  }, [open]);

  if (!open) return null;

  const close = () => {
    if (!busy) onClose?.();
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
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
    <div className="px-dialog-scrim px-form-scrim" onMouseDown={close}>
      <div
        ref={dialogRef}
        className="px-dialog px-form-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-t`}
        aria-describedby={description ? `${id}-d` : undefined}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="px-form-head">
          <div>
            <h2 id={`${id}-t`}>{title}</h2>
            {description ? <p id={`${id}-d`}>{description}</p> : null}
          </div>
          <IconButton label="Close" onClick={close} disabled={busy}>
            <X size={18} aria-hidden="true" />
          </IconButton>
        </div>

        <form
          id={`${id}-f`}
          className="px-form-body"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit && !busy) onSubmit?.();
          }}
        >
          {error ? (
            <div className="px-form-error" role="alert">
              {error}
            </div>
          ) : null}
          {children}
        </form>

        <div className="px-dialog-foot">
          <Button variant="outline" onClick={close} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button type="submit" form={`${id}-f`} disabled={!canSubmit} loading={busy}>
            {SubmitIcon ? <SubmitIcon size={15} aria-hidden="true" /> : null}
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(dialog, document.body) : dialog;
}
