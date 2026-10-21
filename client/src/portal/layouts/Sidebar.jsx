import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, PanelLeftClose } from "lucide-react";
import { BrandMark } from "../../brand";
import { initialsOf } from "../shared/ui/Avatar";
import { WORKSPACE_LABELS } from "../app/portalNav";

// Sidebar (PUI-1). Items come from getNavSectionsByRole(), i.e. the user's
// real role and permissions; hiding an item never replaces the route guard.
const GROUPS_KEY = "portal_nav_closed_groups";

function isActiveItem(item, pathname) {
  if (item.to === "/portal") return pathname === "/portal" || pathname === "/portal/";
  return pathname === item.to || pathname.startsWith(item.to + "/");
}

function readClosedGroups() {
  try {
    const v = JSON.parse(localStorage.getItem(GROUPS_KEY) || "null");
    return Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

export default function Sidebar({
  id,
  navSections = [],
  workspace = "staff",
  user,
  collapsed,
  onToggleCollapsed,
  isDrawer,
  drawerOpen,
  onCloseDrawer,
}) {
  const { pathname } = useLocation();
  const navRef = useRef(null);
  const totalItems = navSections.reduce((n, s) => n + s.items.length, 0);
  const activeGroup = useMemo(
    () => navSections.find((s) => s.items.some((i) => isActiveItem(i, pathname)))?.title,
    [navSections, pathname]
  );

  // Groups: all open for short menus; for long menus, the first group and
  // the group holding the current page start open. Choices are remembered.
  const [closed, setClosed] = useState(() => readClosedGroups());
  const defaultClosed = useMemo(
    () => (totalItems <= 16 ? [] : navSections.slice(1).map((s) => s.title)),
    [navSections, totalItems]
  );
  const closedSet = new Set((closed ?? defaultClosed).filter((t) => t !== activeGroup));

  const toggleGroup = (title) => {
    const next = new Set(closedSet);
    next.has(title) ? next.delete(title) : next.add(title);
    const arr = [...next];
    setClosed(arr);
    try {
      localStorage.setItem(GROUPS_KEY, JSON.stringify(arr));
    } catch {
      /* per-viewer convenience only */
    }
  };

  // Drawer: move focus into the navigation when it opens.
  useEffect(() => {
    if (isDrawer && drawerOpen) {
      const target = navRef.current?.querySelector('[aria-current="page"]') || navRef.current?.querySelector("a");
      target?.focus();
    }
  }, [isDrawer, drawerOpen]);

  const label = WORKSPACE_LABELS[workspace] || WORKSPACE_LABELS.staff;
  const wsInitials = workspace === "staff" ? "ED" : initialsOf(user?.fullName || user?.name || label.name);
  const hiddenDrawer = isDrawer && !drawerOpen;

  return (
    <aside
      id={id}
      className="px-side"
      aria-label="Portal navigation"
      aria-hidden={hiddenDrawer ? true : undefined}
      inert={hiddenDrawer ? "" : undefined}
      role={isDrawer ? "dialog" : undefined}
      aria-modal={isDrawer && drawerOpen ? true : undefined}
    >
      <div className="px-side-head">
        <BrandMark size={34} tone="lotus" />
        <div className="px-wordmark">
          <b>Expresso</b>
          <span>Digital operating system</span>
        </div>
      </div>

      <div className="px-workspace" title={collapsed ? label.name : undefined}>
        <div className="px-workspace-ava" aria-hidden="true">
          {wsInitials}
        </div>
        <div>
          <b>{label.name}</b>
          <span>{label.sub}</span>
        </div>
      </div>

      <nav className="px-nav" ref={navRef} aria-label="Main">
        {navSections.map((section) => {
          const groupId = `px-group-${section.title.replace(/\W+/g, "-").toLowerCase()}`;
          const open = collapsed || !closedSet.has(section.title);
          return (
            <div className="px-nav-group" key={section.title}>
              <button
                type="button"
                className="px-nav-label"
                aria-expanded={open}
                aria-controls={groupId}
                onClick={() => toggleGroup(section.title)}
              >
                {section.title}
                <ChevronDown size={14} aria-hidden="true" />
              </button>
              <ul className="px-nav-list" id={groupId} hidden={!open || undefined}>
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end ?? item.to === "/portal"}
                      className="px-nav-item"
                      aria-label={collapsed ? item.label : undefined}
                      onClick={isDrawer ? onCloseDrawer : undefined}
                    >
                      <item.Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                      <span className="px-nav-text">{item.label}</span>
                      {collapsed ? (
                        <span className="px-tip" aria-hidden="true">
                          {item.label}
                        </span>
                      ) : null}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="px-side-foot">
        <button
          type="button"
          className="px-collapse"
          onClick={onToggleCollapsed}
          aria-pressed={collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-controls={id}
        >
          <PanelLeftClose size={16} aria-hidden="true" />
          <span>{collapsed ? "Expand" : "Collapse"}</span>
        </button>
        <span className="px-ver">Portal</span>
      </div>
    </aside>
  );
}
