// src/portal/pages/AcceptInvite.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { verifyInvite, acceptInvite } from "../features/iam/invites/api";
import {
  AuthShell,
  AuthHeading,
  AuthField,
  AuthError,
  AuthSuccess,
  AuthSubmitButton,
  AuthFooterLink,
} from "../shared/ui/AuthCard";

function roleLabel(role) {
  return String(role || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [checking, setChecking] = useState(true);
  const [invite, setInvite] = useState(null);
  const [verifyError, setVerifyError] = useState("");

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (!token) {
        setVerifyError("This invitation link is missing its token.");
        setChecking(false);
        return;
      }
      try {
        const res = await verifyInvite(token);
        if (cancelled) return;
        if (!res?.ok) throw new Error(res?.message || "This invitation link is invalid");
        setInvite(res.invite);
        setFullName(res.invite?.fullName || "");
      } catch (e) {
        if (cancelled) return;
        setVerifyError(
          e?.response?.data?.message || e?.message || "This invitation link is invalid"
        );
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await acceptInvite({ token, fullName: fullName.trim(), password });
      if (!res?.ok) throw new Error(res?.message || "Something went wrong");
      setDone(true);
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <AuthShell>
        <AuthHeading subtitle="Checking your invitation..." />
      </AuthShell>
    );
  }

  if (verifyError) {
    return (
      <AuthShell>
        <AuthHeading subtitle="You're invited" />
        <AuthError>{verifyError}</AuthError>
        <AuthFooterLink to="/portal/login">Back to login</AuthFooterLink>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell>
        <AuthHeading subtitle="Account activated." />
        <AuthSuccess>
          Your account is ready. You can now log in with your email and
          password.
        </AuthSuccess>
        <AuthFooterLink to="/portal/login">Go to login</AuthFooterLink>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <form onSubmit={submit}>
        <AuthHeading subtitle="You're invited to activate your Client Portal account." />

        <div className="mt-6 grid gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-neutral-500">Email</span>
            <span className="font-semibold text-neutral-900">{invite?.email}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-neutral-500">Role</span>
            <span className="font-semibold text-neutral-900">{roleLabel(invite?.role)}</span>
          </div>
          {invite?.company ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-neutral-500">Company</span>
              <span className="font-semibold text-neutral-900">{invite.company}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-5">
          <AuthField
            label="Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            required
          />
          <AuthField
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            }
          />
          <AuthField
            label="Confirm password"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        <AuthError>{error}</AuthError>

        <AuthSubmitButton loading={loading} loadingLabel="Activating...">
          Activate Account →
        </AuthSubmitButton>

        <AuthFooterLink to="/portal/login">Back to login</AuthFooterLink>
      </form>
    </AuthShell>
  );
}
