import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, CheckCircle2, LogOut, Menu as MenuIcon, MessageCircle, Search, Settings, User, ChevronDown, Plus, LifeBuoy } from "lucide-react";
import { getNotificationCounts } from "../features/messaging/api";
import { listJobs } from "../features/jobs/api";
import Breadcrumbs from "../shared/ui/Breadcrumbs";
import IconButton from "../shared/ui/IconButton";
import Avatar from "../shared/ui/Avatar";
import { useMenu, MenuPanel, MenuItem } from "../shared/ui/Menu";
import { useShell } from "./ShellContext";
import { getRouteCrumbs } from "../app/portalNav";

// Top bar (PUI-1): page context, search entry point (search itself is a
// planned feature), the existing notification counts, a contextual action
// and the account menu.
function useNotificationCounts(user, workspace) {
  const [counts, setCounts] = useState({ unreadMessages: 0, pendingApproval: 0 });
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [msgRes, jobsRes] = await Promise.all([
          getNotificationCounts().catch(() => ({ unreadMessages: 0 })),
          workspace === "client" && user?.clientId
            ? listJobs({ customerId: user.clientId, status: "client_review", limit: 50 }).catch(() => ({ items: [] }))
            : Promise.resolve({ items: [] }),
        ]);
        if (!cancelled) {
          setCounts({
            unreadMessages: msgRes?.unreadMessages || 0,
            pendingApproval: (jobsRes?.items || []).length,
          });
        }
      } catch {
        /* counts are optional */
      }
    }
    load();
    const t = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [user?.clientId, workspace]);
  return counts;
}

export default function Topbar({ user, workspace, navSections, menuButtonRef, navOpen, onOpenNav, onLogout, contextAction }) {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const shell = useShell();
  const crumbs = shell?.crumbs?.length ? shell.crumbs : getRouteCrumbs(pathname, navSections);
  const counts = useNotificationCounts(user, workspace);
  const total = counts.unreadMessages + counts.pendingApproval;

  const search = useMenu();
  const notif = useMenu();
  const account = useMenu();

  const notifications = [
    counts.unreadMessages > 0 && {
      id: "msg",
      icon: MessageCircle,
      title: `${counts.unreadMessages} unread message${counts.unreadMessages !== 1 ? "s" : ""}`,
      sub: "Messages",
      to: "/portal/messages",
    },
    counts.pendingApproval > 0 && {
      id: "approval",
      icon: CheckCircle2,
      title: `${counts.pendingApproval} post${counts.pendingApproval !== 1 ? "s" : ""} awaiting your approval`,
      sub: "Content calendar",
      to: "/portal/content-calendar",
    },
  ].filter(Boolean);

  const searchHint =
    workspace === "vendor" ? "Search RFQs" : workspace === "client" ? "Search projects and files" : "Search clients, projects, invoices";
  const name = user?.fullName || user?.name || "Account";
  const role = String(user?.role || "").replaceAll("_", " ");

  return (
    <header className="px-top">
      <IconButton
        ref={menuButtonRef}
        label="Open navigation"
        className="px-menu-btn"
        aria-controls="px-sidebar"
        aria-expanded={navOpen}
        onClick={onOpenNav}
      >
        <MenuIcon size={18} aria-hidden="true" />
      </IconButton>

      <Breadcrumbs items={crumbs} />

      <div className="px-top-tools">
        <div className="px-menu-anchor">
          <button type="button" className="px-search" {...search.triggerProps} aria-haspopup="dialog" aria-label="Search (coming soon)">
            <Search size={16} aria-hidden="true" />
            <span className="px-search-text">{searchHint}</span>
          </button>
          {search.open ? (
            <MenuPanel panelProps={search.panelProps} role="dialog" label="Search" align="right">
              <div className="px-menu-head">
                <b>Search is coming</b>
                Searching across the whole portal is planned for a later release. For now, use the search on each list.
              </div>
            </MenuPanel>
          ) : null}
        </div>

        {contextAction ? (
          <Link to={contextAction.to} className="px-btn px-btn--sm px-top-cta">
            {workspace === "client" ? <LifeBuoy size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
            {contextAction.label}
          </Link>
        ) : null}

        <div className="px-menu-anchor">
          <IconButton
            label={total ? `Notifications, ${total} new` : "Notifications"}
            badge={total}
            {...notif.triggerProps}
          >
            <Bell size={18} aria-hidden="true" />
          </IconButton>
          {notif.open ? (
            <MenuPanel panelProps={notif.panelProps} label="Notifications" className="w-[320px] max-w-[calc(100vw-20px)]">
              <div className="px-menu-head">
                <b>Notifications</b>
              </div>
              {notifications.length ? (
                notifications.map((n) => (
                  <MenuItem key={n.id} close={() => notif.close()} onSelect={() => nav(n.to)}>
                    <span className="px-notif-row">
                      <i aria-hidden="true">
                        <n.icon size={16} />
                      </i>
                      <span>
                        {n.title}
                        <small>{n.sub}</small>
                      </span>
                    </span>
                  </MenuItem>
                ))
              ) : (
                <div className="px-menu-empty">You're all caught up.</div>
              )}
              <div className="px-menu-note">A full notification centre is planned for a later release.</div>
            </MenuPanel>
          ) : null}
        </div>

        <div className="px-menu-anchor">
          <button type="button" className="px-account" {...account.triggerProps} aria-label={`Account: ${name}`}>
            <Avatar name={name} src={user?.avatarUrl || undefined} />
            <span className="px-who">
              <b>{name}</b>
              <span>{role}</span>
            </span>
            <ChevronDown size={16} aria-hidden="true" className="text-[color:var(--px-muted)]" />
          </button>
          {account.open ? (
            <MenuPanel panelProps={account.panelProps} label="Account">
              <div className="px-menu-head">
                <b>{name}</b>
                {user?.email}
              </div>
              <div className="px-menu-sep" />
              <MenuItem icon={User} close={() => account.close()} onSelect={() => nav("/portal/profile")}>
                Your profile
              </MenuItem>
              <MenuItem icon={Settings} close={() => account.close()} onSelect={() => nav("/portal/settings")}>
                Settings
              </MenuItem>
              <div className="px-menu-sep" />
              <MenuItem icon={LogOut} tone="muted" close={() => account.close()} onSelect={onLogout}>
                Sign out
              </MenuItem>
            </MenuPanel>
          ) : null}
        </div>
      </div>
    </header>
  );
}
