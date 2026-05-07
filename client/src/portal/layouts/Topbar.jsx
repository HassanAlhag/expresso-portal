import React from "react";
import { Bell, Plus, Search, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { LOGO_SRC } from "../app/portalNav";

export default function Topbar({ sidebarOpen, onToggleSidebar, onNewTicket }) {

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
      <div className="tb-right">
        <button type="button" className="tb-icon-btn" title="Notifications">
          <Bell size={16} />
          <span className="tb-notify-dot" />
        </button>

        <button type="button" onClick={onNewTicket} className="tb-cta">
          <Plus size={14} strokeWidth={2.5} />
          <span>New ticket</span>
        </button>

      </div>
    </div>
  );
}
