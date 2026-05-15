import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { me } from "../shared/api/auth.api";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import { getNavSectionsByRole } from "../app/portalNav";

const SIDEBAR_OPEN = 256;
const SIDEBAR_CLOSED = 68;
const MOBILE_BP = 768;

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

function isMobileViewport() {
  return typeof window !== "undefined" && window.innerWidth < MOBILE_BP;
}

export default function PortalLayout() {
  const nav = useNavigate();
  const [user, setUser] = useState(() => readStoredUser());
  const [isMobile, setIsMobile] = useState(() => isMobileViewport());
  const [sidebarOpen, setSidebarOpen] = useState(() => !isMobileViewport());

  const sidebarW = sidebarOpen ? SIDEBAR_OPEN : SIDEBAR_CLOSED;

  useEffect(() => {
    const onResize = () => {
      const mobile = isMobileViewport();
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  const closeMobileSidebar = useCallback(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

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
        {/* Mobile backdrop — dims content behind open drawer */}
        {isMobile && sidebarOpen && (
          <div
            className="portal-mobile-backdrop"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={[
            "portal-sidebar",
            isMobile && sidebarOpen ? "portal-sidebar--mobile-open" : "",
          ].filter(Boolean).join(" ")}
          style={isMobile ? undefined : { width: sidebarW }}
        >
          <Sidebar
            sidebarOpen={isMobile ? true : sidebarOpen}
            navSections={navSections}
            user={user}
            onLogout={onLogout}
            onNavClick={closeMobileSidebar}
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
