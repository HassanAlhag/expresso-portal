// src/portal/pages/ForgotPassword.jsx
import React, { useState } from "react";
import { forgotPassword } from "../shared/api/auth.api";
import {
  AuthShell,
  AuthHeading,
  AuthField,
  AuthError,
  AuthSuccess,
  AuthSubmitButton,
  AuthFooterLink,
} from "../shared/ui/AuthCard";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await forgotPassword({ email });
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
        <AuthHeading subtitle="Check your email." />
        <AuthSuccess>
          If an account exists for {email}, we've sent a link to reset your
          password. The link expires in 1 hour.
        </AuthSuccess>
        <AuthFooterLink to="/portal/login">Back to login</AuthFooterLink>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <form onSubmit={submit}>
        <AuthHeading subtitle="Enter your email and we'll send you a reset link." />

        <div className="mt-8 grid gap-5">
          <AuthField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <AuthError>{error}</AuthError>

        <AuthSubmitButton loading={loading} loadingLabel="Sending...">
          Send reset link →
        </AuthSubmitButton>

        <AuthFooterLink to="/portal/login">Back to login</AuthFooterLink>
      </form>
    </AuthShell>
  );
}
