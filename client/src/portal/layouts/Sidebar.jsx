import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronRight, LogOut } from "lucide-react";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function findActiveSection(navSections, pathname) {
  return navSections.find((sec) =>
    sec.items.some(
      (item) =>
        pathname === item.to ||
        (item.to !== "/portal" && pathname.startsWith(item.to + "/")) ||
        (item.to !== "/portal" && pathname.startsWith(item.to))
    )
  );
}

export default function Sidebar({ sidebarOpen, navSections = [], user, onLogout }) {
  const location = useLocation();
  const [openSection, setOpenSection] = useState(() => {
    const active = findActiveSection(navSections, location.pathname);
    return active ? active.title : navSections[0]?.title ?? null;
  });

  useEffect(() => {
    const active = findActiveSection(navSections, location.pathname);
    if (active) setOpenSection(active.title);
  }, [location.pathname, navSections]);

  function toggle(title) {
    setOpenSection((prev) => (prev === title ? null : title));
  }

  return (
    <div className="sb-root">
      <nav className="sb-nav">
        {navSections.map((sec) =>
          sidebarOpen ? (
            <AccordionSection
              key={sec.title}
              section={sec}
              isOpen={openSection === sec.title}
              onToggle={() => toggle(sec.title)}
            />
          ) : (
            <CollapsedSection key={sec.title} section={sec} />
          )
        )}
      </nav>

      {user && (
        <div className="sb-footer">
          <div className="sb-user">
            <span className="sb-avatar">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="sb-avatar-img" />
              ) : (
                getInitials(user.fullName || user.name)
              )}
            </span>
            {sidebarOpen && (
              <>
                <div className="sb-user-info">
                  <span className="sb-user-name">
                    {user.fullName || user.name || "User"}
                  </span>
                  <span className="sb-user-role">
                    {String(user.role || "").replaceAll("_", " ")}
                  </span>
                </div>
                {onLogout && (
                  <button className="sb-logout" onClick={onLogout} title="Sign out">
                    <LogOut size={14} strokeWidth={2} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AccordionSection({ section, isOpen, onToggle }) {
  const SectionIcon = section.Icon;
  return (
    <div className="sb-section">
      <button
        type="button"
        className={`sb-section-header${isOpen ? " sb-section-header--open" : ""}`}
        onClick={onToggle}
      >
        {SectionIcon && (
          <span className="sb-section-icon">
            <SectionIcon size={15} strokeWidth={2} />
          </span>
        )}
        <span className="sb-section-label">{section.title}</span>
        <ChevronRight
          size={13}
          strokeWidth={2.2}
          className={`sb-section-chevron${isOpen ? " sb-section-chevron--open" : ""}`}
        />
      </button>
      <div className={`sb-section-items${isOpen ? " sb-section-items--open" : ""}`}>
        <ul className="sb-list sb-list--nested">
          {section.items.map((item) => (
            <NavItem key={item.to} item={item} collapsed={false} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function CollapsedSection({ section }) {
  return (
    <div className="sb-section">
      <hr className="sb-section-divider" />
      <ul className="sb-list">
        {section.items.map((item) => (
          <NavItem key={item.to} item={item} collapsed />
        ))}
      </ul>
    </div>
  );
}

function NavItem({ item, collapsed }) {
  const Icon = item.Icon;
  return (
    <li>
      <NavLink
        to={item.to}
        end={item.end ?? (item.to === "/portal")}
        className={({ isActive }) =>
          "sb-item" + (isActive ? " sb-item--active" : "")
        }
      >
        <span className="sb-item-icon">
          <Icon size={17} strokeWidth={1.75} />
        </span>
        {!collapsed && <span className="sb-item-label">{item.label}</span>}
        {collapsed && <span className="sb-tooltip">{item.label}</span>}
      </NavLink>
    </li>
  );
}
