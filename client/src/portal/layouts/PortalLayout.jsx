import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { me } from "../shared/api/auth.api";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import { getNavSectionsByRole } from "../app/portalNav";

const SIDEBAR_OPEN = 256;
const SIDEBAR_CLOSED = 68;

export default function PortalLayout() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);
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
        }
      } catch {
        localStorage.removeItem("portal_token");
        localStorage.removeItem("portal_user");
        nav("/portal/login", { replace: true });
      }
    };

    run();
  }, [nav]);

  const onLogout = () => {
    localStorage.removeItem("portal_token");
    localStorage.removeItem("portal_user");
    setUser(null);
    nav("/portal/login", { replace: true });
  };

  const navSections = useMemo(
    () => getNavSectionsByRole(user?.role),
    [user?.role]
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
