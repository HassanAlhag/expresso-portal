// src/portal/shared/ui/AuthCard.jsx
// Shared visual chrome for the Client Portal auth pages (login, forgot
// password, reset password) so they stay visually consistent.
import React from "react";
import { Link } from "react-router-dom";

const BRAND = "#7F8AD1";

export function AuthShell({ children }) {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px circle at 18% 10%, rgba(127,138,209,0.14), transparent 55%), radial-gradient(800px circle at 85% 30%, rgba(0,0,0,0.05), transparent 55%)",
          }}
        />
      </div>

      <div className="mx-auto flex min-h-screen w-[min(980px,92vw)] items-center justify-center py-10">
        <div className="w-full max-w-xl rounded-[32px] border border-neutral-200 bg-white/85 p-7 shadow-[0_30px_120px_rgba(0,0,0,0.10)] backdrop-blur-xl sm:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthHeading({ title, subtitle }) {
  return (
    <>
      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
        <span style={{ color: BRAND }}>Expresso</span>{" "}
        <span className="text-neutral-950">Client Portal</span>
      </h1>
      {title ? (
        <p className="mt-3 text-lg font-semibold text-neutral-900">{title}</p>
      ) : null}
      {subtitle ? (
        <p className="mt-1 text-base text-neutral-600">{subtitle}</p>
      ) : null}
    </>
  );
}

export function AuthField({ label, trailing, ...props }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold tracking-[0.18em] text-neutral-500">
        {label}
      </span>
      <div className="relative">
        <input
          {...props}
          className="h-14 w-full rounded-2xl border border-neutral-200 bg-white px-4 pr-4 text-base text-neutral-900 shadow-sm outline-none transition focus:border-neutral-300 focus:ring-4 focus:ring-black/5"
          style={trailing ? { paddingRight: "3.25rem" } : undefined}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-3 flex items-center">
            {trailing}
          </div>
        ) : null}
      </div>
    </label>
  );
}

export function AuthError({ children }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {children}
    </p>
  );
}

export function AuthSuccess({ children }) {
  if (!children) return null;
  return (
    <p
      role="status"
      className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
    >
      {children}
    </p>
  );
}

export function AuthSubmitButton({ loading, loadingLabel, children, ...props }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-8 w-full rounded-2xl px-6 py-4 text-sm font-extrabold text-white active:scale-[0.99] disabled:opacity-70"
      style={{
        background:
          "linear-gradient(135deg, rgba(127,138,209,1) 0%, rgba(0,0,0,0.92) 120%)",
      }}
      {...props}
    >
      {loading ? loadingLabel || "Please wait..." : children}
    </button>
  );
}

export function AuthFooterLink({ to, children }) {
  return (
    <p className="mt-5 text-center text-sm text-neutral-500">
      <Link to={to} className="font-semibold" style={{ color: BRAND }}>
        {children}
      </Link>
    </p>
  );
}
