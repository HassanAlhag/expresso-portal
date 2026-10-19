// src/portal/pages/ResetPassword.jsx
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { resetPassword } from "../shared/api/auth.api";
import {
  AuthShell,
  AuthHeading,
  AuthField,
  AuthError,
  AuthSuccess,
  AuthSubmitButton,
  AuthFooterLink,
} from "../shared/ui/AuthCard";

export default function ResetPassword() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is missing its token. Please request a new one.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({ token, newPassword });
      if (!res?.ok) throw new Error(res?.message || "Something went wrong");
      setDone(true);
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthShell>
        <AuthHeading subtitle="Password updated." />
        <AuthSuccess>
          Your password has been reset. You can now sign in with your new
          password.
        </AuthSuccess>
        <AuthSubmitButton
          type="button"
          loading={false}
          onClick={() => nav("/portal/login")}
        >
          Go to login →
        </AuthSubmitButton>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <form onSubmit={submit}>
        <AuthHeading subtitle="Choose a new password." />

        {!token ? (
          <AuthError>
            This reset link is invalid or missing its token. Please request a
            new one from the forgot password page.
          </AuthError>
        ) : null}

        <div className="mt-8 grid gap-5">
          <AuthField
            label="New password"
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
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
            label="Confirm new password"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        <AuthError>{error}</AuthError>

        <AuthSubmitButton loading={loading} loadingLabel="Updating...">
          Reset password →
        </AuthSubmitButton>

        <AuthFooterLink to="/portal/login">Back to login</AuthFooterLink>
      </form>
    </AuthShell>
  );
}
