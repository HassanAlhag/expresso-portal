import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { me } from "../shared/api/auth.api";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import { getNavSectionsByRole } from "../app/portalNav";

const SIDEBAR_OPEN = 256;
const SIDEBAR_CLOSED = 68;

function readStoredUser() {
  try {
    const raw = localStorage.getItem("portal_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export default function PortalLayout() {
  const nav = useNavigate();
  const [user, setUser] = useState(() => readStoredUser());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sidebarW = sidebarOpen ? SIDEBAR_OPEN : SIDEBAR_CLOSED;

  useEffect(() => {
    const run = async () => {
      try {
        const res = await me();
        const userData = res?.user || null;

        setUser(userData);

        if (userData) {
          localStorage.setItem("portal_user", JSON.stringify(userData));
          localStorage.setItem(
            "portal_permissions",
            JSON.stringify(userData.permissions || [])
          );
        }
      } catch {
        localStorage.removeItem("portal_token");
        localStorage.removeItem("portal_user");
        localStorage.removeItem("portal_permissions");
        nav("/portal/login", { replace: true });
      }
    };

    run();
  }, [nav]);

  const onLogout = () => {
    localStorage.removeItem("portal_token");
    localStorage.removeItem("portal_user");
    localStorage.removeItem("portal_permissions");
    setUser(null);
    nav("/portal/login", { replace: true });
  };

  const navSections = useMemo(
    () => getNavSectionsByRole(user?.role, user?.permissions || []),
    [user?.role, user?.permissions]
  );

  return (
    <div className="portal-app portal-shell">
      <div className="portal-topbar">
        <Topbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onNewTicket={() => nav("/portal/tickets")}
        />
      </div>

      <div className="portal-body">
        <aside className="portal-sidebar" style={{ width: sidebarW }}>
          <Sidebar
            sidebarOpen={sidebarOpen}
            navSections={navSections}
            user={user}
            onLogout={onLogout}
          />
        </aside>

        <main className="portal-main">
          <div className="portal-section">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
