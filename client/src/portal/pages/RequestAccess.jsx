// src/portal/pages/RequestAccess.jsx
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { requestAccess } from "../shared/api/auth.api";
import {
  AuthShell,
  AuthHeading,
  AuthField,
  AuthError,
  AuthSuccess,
  AuthSubmitButton,
  AuthFooterLink,
} from "../shared/ui/AuthCard";

export default function RequestAccess() {
  const location = useLocation();
  // Prefilled only through transient router state (never a URL query param)
  // when arriving from the "no portal access" Google handoff. This is a
  // convenience only — it does not grant or imply verified authorization.
  const prefillEmail = location.state?.prefillEmail || "";
  const prefillNotice = location.state?.notice || "";

  const [fullName, setFullName] = useState("");
  const [workEmail, setWorkEmail] = useState(prefillEmail);
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await requestAccess({
        fullName,
        workEmail,
        company,
        phone,
        message,
      });
      if (!res?.ok) throw new Error(res?.message || "Something went wrong");
      setSubmitted(true);
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthShell>
        <AuthHeading subtitle="Request received." />
        <AuthSuccess>
          Your request has been received. Our team will review it and
          contact you regarding portal access.
        </AuthSuccess>
        <AuthFooterLink to="/portal/login">Back to login</AuthFooterLink>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <form onSubmit={submit}>
        <AuthHeading subtitle="Tell us a bit about yourself and we'll be in touch." />

        {prefillNotice ? (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {prefillNotice}
          </p>
        ) : null}

        <div className="mt-8 grid gap-5">
          <AuthField
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            required
          />
          <AuthField
            label="Work email"
            type="email"
            value={workEmail}
            onChange={(e) => setWorkEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <AuthField
            label="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            autoComplete="organization"
            required
          />
          <AuthField
            label="Phone (optional)"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />

          <label className="grid gap-2">
            <span className="text-xs font-semibold tracking-[0.18em] text-neutral-500">
              Message (optional)
            </span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={1000}
              className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-900 shadow-sm outline-none transition focus:border-neutral-300 focus:ring-4 focus:ring-black/5"
            />
          </label>
        </div>

        <AuthError>{error}</AuthError>

        <AuthSubmitButton loading={loading} loadingLabel="Sending...">
          Request Access →
        </AuthSubmitButton>

        <AuthFooterLink to="/portal/login">Back to login</AuthFooterLink>
      </form>
    </AuthShell>
  );
}
