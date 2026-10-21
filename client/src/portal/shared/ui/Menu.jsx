import React, { useCallback, useEffect, useId, useRef, useState } from "react";

// Accessible dropdown: the trigger gets aria-haspopup/aria-expanded, the
// panel closes on Escape (focus returns to the trigger), on outside click
// and after an item is chosen; ArrowUp/ArrowDown move between items.
export function useMenu() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const id = useId();

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (panelRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const first = panelRef.current?.querySelector('[role="menuitem"], a, button');
      first?.focus();
    }
  }, [open]);

  const onPanelKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      const items = [...(panelRef.current?.querySelectorAll('[role="menuitem"]') || [])];
      if (!items.length) return;
      e.preventDefault();
      const i = items.indexOf(document.activeElement);
      const next = (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next].focus();
    }
  };

  return {
    open,
    setOpen,
    close,
    triggerProps: {
      ref: triggerRef,
      "aria-haspopup": "menu",
      "aria-expanded": open,
      "aria-controls": open ? id : undefined,
      onClick: () => setOpen((v) => !v),
    },
    panelProps: { ref: panelRef, id, onKeyDown: onPanelKeyDown },
  };
}

export function MenuPanel({ panelProps, label, align = "right", role = "menu", className = "", children }) {
  return (
    <div
      {...panelProps}
      role={role}
      aria-label={label}
      data-align={align}
      className={["px-menu", className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}

export function MenuItem({ icon: Icon, children, tone, onSelect, close, ...props }) {
  return (
    <button
      type="button"
      role="menuitem"
      className="px-menu-item"
      data-tone={tone}
      onClick={(e) => {
        onSelect?.(e);
        close?.();
      }}
      {...props}
    >
      {Icon ? <Icon size={16} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
