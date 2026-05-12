// src/portal/pages/PortalLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../shared/api/auth.api";

const BRAND = "#7F8AD1";
const TOKEN_KEY = "portal_token";

export default function PortalLogin() {
  const nav = useNavigate();

  const [company, setCompany] = useState(
    localStorage.getItem("portal_client") || ""
  );
  const [email, setEmail] = useState(
    localStorage.getItem("portal_email") || ""
  );
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const enter = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login({ email, password });
      if (!res?.ok) throw new Error(res?.message || "Login failed");

      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem("portal_client", company || "Client");
      localStorage.setItem("portal_email", email || "");
      localStorage.setItem("portal_user", JSON.stringify(res.user || null));
      localStorage.setItem("portal_permissions", JSON.stringify(res.user?.permissions || []));

      // ✅ New plan: NO onboarding. Always go to portal.
      nav("/portal", { replace: true });
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

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
        <form
          onSubmit={enter}
          className="w-full max-w-xl rounded-[32px] border border-neutral-200 bg-white/85 p-7 shadow-[0_30px_120px_rgba(0,0,0,0.10)] backdrop-blur-xl sm:p-10"
        >
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            <span style={{ color: BRAND }}>Expresso</span>{" "}
            <span className="text-neutral-950">Client Portal</span>
          </h1>

          <p className="mt-3 text-base text-neutral-600">Login to continue.</p>

          <div className="mt-8 grid gap-5">
            <Field
              label="Company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              autoComplete="organization"
            />
            <Field
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full rounded-2xl px-6 py-4 text-sm font-extrabold text-white active:scale-[0.99] disabled:opacity-70"
            style={{
              background:
                "linear-gradient(135deg, rgba(127,138,209,1) 0%, rgba(0,0,0,0.92) 120%)",
            }}
          >
            {loading ? "Signing in..." : "Enter portal →"}
          </button>

          <p className="mt-5 text-sm text-neutral-500">
            Test user: superadmin@expresso.com / Inf-123*
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold tracking-[0.18em] text-neutral-500">
        {label}
      </span>
      <input
        {...props}
        className="h-14 rounded-2xl border border-neutral-200 bg-white px-4 text-base text-neutral-900 shadow-sm outline-none transition focus:border-neutral-300 focus:ring-4 focus:ring-black/5"
      />
    </label>
  );
}
