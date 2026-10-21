import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { me } from "../shared/api/auth.api";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import { ShellProvider } from "./ShellContext";
import { getNavSectionsByRole, getWorkspaceKind } from "../app/portalNav";

// Application shell (PUI-1): dark sidebar with permission-filtered groups,
// top bar with page context, and a balanced page column. Desktop sidebar
// collapses to an icon rail; at 960 px and below it becomes a drawer.
const DRAWER_QUERY = "(max-width: 960px)";
const COLLAPSE_KEY = "portal_nav_collapsed";

function readStoredUser() {
  try {
    const parsed = JSON.parse(localStorage.getItem("portal_user") || "null");
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

function useMediaQuery(query) {
  const get = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener ? mq.addEventListener("change", onChange) : mq.addListener(onChange);
    return () => (mq.removeEventListener ? mq.removeEventListener("change", onChange) : mq.removeListener(onChange));
  }, [query]);
  return matches;
}

export default function PortalLayout() {
  const nav = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => readStoredUser());
  const [collapsed, setCollapsed] = useState(() => readCollapsed());
  const [navOpen, setNavOpen] = useState(false);
  const isDrawer = useMediaQuery(DRAWER_QUERY);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await me();
        const userData = res?.user || null;
        setUser(userData);
        if (userData) {
          localStorage.setItem("portal_user", JSON.stringify(userData));
          localStorage.setItem("portal_permissions", JSON.stringify(userData.permissions || []));
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

  // The drawer closes when the route changes.
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isDrawer) setNavOpen(false);
  }, [isDrawer]);

  const closeDrawer = useCallback(() => {
    setNavOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!navOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [navOpen, closeDrawer]);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* per-viewer convenience only */
      }
      return next;
    });
  };

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
  const workspace = getWorkspaceKind(user);
  const permissions = user?.permissions || [];
  const isAdmin = ["super_admin", "admin"].includes(String(user?.role || "").toLowerCase());
  const canOpenTickets = isAdmin || permissions.includes("tickets.read");

  return (
    <ShellProvider>
      <div className="portal-app" data-workspace={workspace}>
        <a href="#px-main" className="px-skip">
          Skip to content
        </a>
        <div
          className="px-shell"
          data-collapsed={String(collapsed && !isDrawer)}
          data-nav-open={String(isDrawer && navOpen)}
        >
          <Sidebar
            id="px-sidebar"
            navSections={navSections}
            workspace={workspace}
            user={user}
            collapsed={collapsed && !isDrawer}
            onToggleCollapsed={toggleCollapsed}
            isDrawer={isDrawer}
            drawerOpen={navOpen}
            onCloseDrawer={closeDrawer}
          />
          {isDrawer && navOpen ? <div className="px-scrim" aria-hidden="true" onClick={closeDrawer} /> : null}
          <div className="px-main">
            <Topbar
              user={user}
              workspace={workspace}
              navSections={navSections}
              menuButtonRef={menuButtonRef}
              navOpen={navOpen}
              onOpenNav={() => setNavOpen(true)}
              onLogout={onLogout}
              contextAction={
                canOpenTickets
                  ? { label: workspace === "client" ? "Get help" : "New ticket", to: "/portal/tickets" }
                  : null
              }
            />
            <div className="px-scroll" id="px-scroll">
              <main id="px-main" className="px-page" tabIndex={-1}>
                <Outlet />
              </main>
            </div>
          </div>
        </div>
      </div>
    </ShellProvider>
  );
}
