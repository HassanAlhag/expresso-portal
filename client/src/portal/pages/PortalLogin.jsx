// src/portal/pages/PortalLogin.jsx
import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { login, googleLogin } from "../shared/api/auth.api";
import {
  AuthShell,
  AuthHeading,
  AuthField,
  AuthError,
  AuthSubmitButton,
  AuthFooterLink,
} from "../shared/ui/AuthCard";

const TOKEN_KEY = "portal_token";
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

// Decoded for a UI hint only (prefilling the Request Access email) — this
// is never treated as verified authorization. The actual login decision
// always happens server-side against the Google-signed credential.
function decodeEmailHint(credential) {
  try {
    const payload = JSON.parse(atob(credential.split(".")[1]));
    return payload?.email || "";
  } catch {
    return "";
  }
}

function applySession(res, email) {
  localStorage.setItem(TOKEN_KEY, res.token);
  localStorage.setItem("portal_email", email || res.user?.email || "");
  localStorage.setItem("portal_user", JSON.stringify(res.user || null));
  localStorage.setItem("portal_permissions", JSON.stringify(res.user?.permissions || []));
}

export default function PortalLogin() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get("expired") === "1";
  // Return to the page the user was on; only internal portal paths allowed.
  const nextPath = (() => {
    const n = searchParams.get("next") || "";
    return n.startsWith("/portal") && !n.startsWith("//") ? n : "/portal";
  })();

  const [email, setEmail] = useState(
    localStorage.getItem("portal_email") || ""
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  const enter = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login({ email, password });
      if (!res?.ok) throw new Error(res?.message || "Login failed");

      applySession(res, email);
      nav(nextPath, { replace: true });
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (googleLoading) return; // guard against double submission
    setGoogleError("");
    setGoogleLoading(true);

    const credential = credentialResponse?.credential || "";

    try {
      const res = await googleLogin({ credential });

      if (res?.ok) {
        applySession(res);
        nav(nextPath, { replace: true });
        return;
      }

      if (res?.code === "NO_PORTAL_ACCESS") {
        nav("/portal/request-access", {
          state: {
            prefillEmail: decodeEmailHint(credential),
            notice: "This Google account does not currently have Client Portal access.",
          },
        });
        return;
      }

      setGoogleError(res?.message || "Google sign-in failed. Please try again.");
    } catch (e2) {
      setGoogleError(
        e2?.response?.data?.message || e2?.message || "Google sign-in failed. Please try again."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setGoogleError("Google sign-in failed. Please try again or use your email and password.");
  };

  return (
    <AuthShell>
      <form onSubmit={enter}>
        <AuthHeading subtitle="Welcome back." />

        <div className="mt-8 grid gap-5">
          <AuthField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <AuthField
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
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
        </div>

        <AuthError>
          {error || (sessionExpired ? "Your session has expired. Please sign in again." : "")}
        </AuthError>

        <AuthSubmitButton loading={loading} loadingLabel="Signing in...">
          Sign In →
        </AuthSubmitButton>

        <AuthFooterLink to="/portal/forgot-password">
          Forgot password?
        </AuthFooterLink>

        {GOOGLE_CLIENT_ID ? (
          <div className="mt-6">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-neutral-200" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                or
              </span>
              <div className="h-px flex-1 bg-neutral-200" />
            </div>

            <div className="mt-5 flex justify-center">
              {googleLoading ? (
                <div
                  className="flex h-10 w-full max-w-[280px] items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-sm font-semibold text-neutral-500"
                  aria-live="polite"
                >
                  Verifying with Google...
                </div>
              ) : (
                <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    shape="pill"
                    text="continue_with"
                    width="280"
                    locale="en"
                  />
                </GoogleOAuthProvider>
              )}
            </div>

            <AuthError>{googleError}</AuthError>
          </div>
        ) : null}

        <p className="mt-4 text-center text-sm text-neutral-500">
          Need access?{" "}
          <Link to="/portal/request-access" className="font-semibold" style={{ color: "#7F8AD1" }}>
            Request access
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
