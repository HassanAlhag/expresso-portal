import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Best practice:
 * - header surface (system info + actions)
 * - optional subheader surface (tabs / secondary controls)
 * - content surface (tabpanel/paper)
 */
export default function DetailsShell({
  backTo,
  eyebrow = "WORKSPACE",
  title,
  subtitle,
  right,
  tabs,
  children,
}) {
  const nav = useNavigate();

  return (
    <div className="portal-section">
      {/* Header (SYSTEM) */}
      <div className="portal-surface-header p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => nav(backTo)}
              className="portal-btn inline-flex items-center gap-2 border border-black/10 bg-white px-3 py-2 text-xs font-extrabold text-slate-900 hover:bg-black/[0.03]"
            >
              <ArrowLeft size={14} />
              Back
            </button>

            {eyebrow ? (
              <div className="portal-eyebrow mt-5">{eyebrow}</div>
            ) : null}

            <div className="portal-title truncate">{title}</div>
            {subtitle ? (
              <div className="portal-subtitle truncate">{subtitle}</div>
            ) : null}
          </div>

          {right ? (
            <div className="flex items-center gap-2 shrink-0">{right}</div>
          ) : null}
        </div>
      </div>

      {/* Tabs / Secondary controls */}
      {tabs ? <div className="portal-surface-soft p-4">{tabs}</div> : null}

      {/* Content (TAB PANEL / PAPER) */}
      <div className="portal-tabpanel">{children}</div>
    </div>
  );
}
