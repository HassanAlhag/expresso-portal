import React, { useEffect, useRef, useState } from "react";
import { Bell, Plus, Search, PanelLeftClose, PanelLeftOpen, CheckCircle2, MessageCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LOGO_SRC } from "../app/portalNav";
import { getNotificationCounts } from "../features/messaging/api";
import { listJobs } from "../features/jobs/api";

function useClickOutside(ref, handler) {
  useEffect(() => {
    function listener(e) {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler();
    }
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

export default function Topbar({ sidebarOpen, onToggleSidebar, onNewTicket }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState({ unreadMessages: 0, pendingApproval: 0 });
  const dropRef = useRef(null);

  useClickOutside(dropRef, () => setOpen(false));

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const me = (() => { try { return JSON.parse(localStorage.getItem("portal_user") || "{}"); } catch { return {}; } })();
        const clientRoles = new Set(["client", "staff_client", "procurement_client", "client_admin"]);
        const isClient = clientRoles.has(me.role || "");

        const [msgRes, jobsRes] = await Promise.all([
          getNotificationCounts().catch(() => ({ unreadMessages: 0 })),
          isClient && me.clientId
            ? listJobs({ customerId: me.clientId, status: "client_review", limit: 50 }).catch(() => ({ items: [] }))
            : Promise.resolve({ items: [] }),
        ]);

        if (!cancelled) {
          setCounts({
            unreadMessages: msgRes?.unreadMessages || 0,
            pendingApproval: (jobsRes?.items || []).length,
          });
        }
      } catch {
        // silently ignore
      }
    }
    load();
    const interval = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const totalCount = counts.unreadMessages + counts.pendingApproval;

  const notifications = [
    counts.unreadMessages > 0 && {
      id: "msg",
      icon: MessageCircle,
      color: "text-indigo-500 bg-indigo-50",
      title: `${counts.unreadMessages} unread message${counts.unreadMessages !== 1 ? "s" : ""}`,
      sub: "From your agency",
      action: () => { nav("/portal/messages"); setOpen(false); },
    },
    counts.pendingApproval > 0 && {
      id: "approval",
      icon: CheckCircle2,
      color: "text-orange-500 bg-orange-50",
      title: `${counts.pendingApproval} post${counts.pendingApproval !== 1 ? "s" : ""} awaiting approval`,
      sub: "Content calendar",
      action: () => { nav("/portal/content-calendar"); setOpen(false); },
    },
  ].filter(Boolean);

  return (
    <div className="tb-root">
      {/* Left — toggle + brand */}
      <div className="tb-left">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="tb-toggle"
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>

        <div className="tb-brand">
          <div className="tb-logo-mark">
            <img
              src={LOGO_SRC}
              alt="Expresso"
              className="tb-logo-img"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          </div>
          <span className="tb-wordmark">Expresso</span>
        </div>
      </div>

      {/* Center — search */}
      <button type="button" className="tb-search">
        <Search size={13} className="tb-search-icon" />
        <span className="tb-search-placeholder">Search clients, projects, tickets…</span>
        <span className="tb-kbd">⌘K</span>
      </button>

      {/* Right */}
      <div className="tb-right" ref={dropRef} style={{ position: "relative" }}>
        <button
          type="button"
          className="tb-icon-btn"
          title="Notifications"
          onClick={() => setOpen((v) => !v)}
        >
          <Bell size={16} />
          {totalCount > 0 && (
            <span
              className="tb-notify-dot"
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: "#ef4444",
                color: "#fff",
                fontSize: 9,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 3px",
              }}
            >
              {totalCount}
            </span>
          )}
        </button>

        {/* Notification dropdown */}
        {open && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: 300,
              background: "#fff",
              borderRadius: 16,
              boxShadow: "0 8px 32px rgba(15,23,42,0.18)",
              border: "1px solid rgba(0,0,0,0.07)",
              zIndex: 200,
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 10px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Notifications</span>
              <button type="button" onClick={() => setOpen(false)} style={{ color: "#94a3b8", cursor: "pointer", display: "flex" }}>
                <X size={14} />
              </button>
            </div>

            {notifications.length === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center" }}>
                <Bell size={24} style={{ margin: "0 auto 8px", color: "#e2e8f0" }} />
                <p style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>All caught up!</p>
                <p style={{ fontSize: 11, color: "#cbd5e1" }}>No new notifications</p>
              </div>
            ) : (
              <div>
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={n.action}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      width: "100%",
                      padding: "12px 16px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                  >
                    <span style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8 }} className={n.color}>
                      <n.icon size={16} />
                    </span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0 }}>{n.title}</p>
                      <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>{n.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button type="button" onClick={onNewTicket} className="tb-cta">
          <Plus size={14} strokeWidth={2.5} />
          <span>New ticket</span>
        </button>
      </div>
    </div>
  );
}
