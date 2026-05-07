import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

// ── Toast visual component ─────────────────────────────────────────────────────

const TONE_MAP = {
  success: { icon: CheckCircle2, cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  warning: { icon: AlertTriangle, cls: "border-amber-200 bg-amber-50 text-amber-800" },
  danger:  { icon: AlertTriangle, cls: "border-rose-200 bg-rose-50 text-rose-800" },
  info:    { icon: Info,          cls: "border-indigo-200 bg-indigo-50 text-indigo-800" },
};

function ToastItem({ tone = "info", message, title, onClose }) {
  const item = TONE_MAP[tone] || TONE_MAP.info;
  const Icon = item.icon;

  return (
    <div
      className={[
        "flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-md",
        item.cls,
      ].join(" ")}
    >
      <Icon size={17} className="mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        {title   && <div className="text-sm font-black">{title}</div>}
        {message && <div className={["text-sm", title ? "mt-0.5 opacity-80" : "font-semibold"].join(" ")}>{message}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 opacity-60 transition hover:bg-black/8 hover:opacity-100"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}

// ── Context ───────────────────────────────────────────────────────────────────

const ToastCtx = createContext(null);

let _uid = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (tone, message, { title, duration = 4000 } = {}) => {
      const id = ++_uid;
      setToasts((ts) => [...ts, { id, tone, message, title }]);
      timers.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (msg, opts) => push("success", msg, opts),
      error:   (msg, opts) => push("danger",  msg, opts),
      warning: (msg, opts) => push("warning", msg, opts),
      info:    (msg, opts) => push("info",    msg, opts),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {/* toast stack — bottom-right, above everything */}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem
              tone={t.tone}
              title={t.title}
              message={t.message}
              onClose={() => dismiss(t.id)}
            />
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// default export keeps backward compat for any direct <Toast /> usage
export default ToastItem;
