import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FiMenu, FiX, FiChevronDown } from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { buildMenus, isMenuActive, useCmsNavData } from "./navData";
import BrandMark from "../../brand/BrandMark";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import {
  resolveWebsiteImage,
  toWebsiteImageUrl,
} from "../../utils/websiteImages";

// Same menus as the desktop mega menu, flattened into labelled groups.
function toMobileSections(menu) {
  const sections = [];
  if (menu.featured?.length) {
    sections.push({
      label: null,
      items: menu.featured.map((f) => ({ text: f.title, href: f.to, badge: f.badge })),
    });
  }
  for (const g of menu.groups || []) {
    if (g.items?.length) {
      sections.push({ label: g.label, items: g.items.map((i) => ({ text: i.title, href: i.to })) });
    }
  }
  if (menu.action?.primary) {
    sections.push({
      label: null,
      items: [{ text: menu.action.primary.label, href: menu.action.primary.to, emphasis: true }],
    });
  }
  return sections;
}

const toMenuId = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getFocusableElements = (root) => {
  if (!root) return [];

  return Array.from(
    root.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => el.offsetParent !== null);
};

function NavRow({ menu, active, onClose }) {
  const [open, setOpen] = useState(active);
  const sections = toMobileSections(menu);
  const hasSub = sections.some((x) => x.items.length);
  const toggleId = `${toMenuId(menu.text)}-toggle`;
  const submenuId = `${toMenuId(menu.text)}-submenu`;

  return (
    <div className="border-b border-ink-100">
      <div className="flex items-center justify-between py-3.5">
        <Link
          to={menu.href}
          onClick={onClose}
          aria-current={active ? "page" : undefined}
          className={`flex items-center gap-2 text-[17px] font-bold no-underline ${
            active ? "text-lotus-700" : "text-night"
          }`}
        >
          {active ? <BrandMark size={18} /> : null}
          {menu.text}
        </Link>
        {hasSub && (
          <button
            type="button"
            id={toggleId}
            aria-expanded={open}
            aria-controls={submenuId}
            aria-label={`${open ? "Collapse" : "Expand"} ${menu.text}`}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100"
          >
            <FiChevronDown
              size={18}
              className={`text-ink-500 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      {hasSub && open && (
        <div id={submenuId} role="region" aria-labelledby={toggleId} className="pb-3">
          {sections.map((section, i) => (
            <div key={section.label || i} className="pb-2">
              {section.label ? (
                <div className="px-2 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">
                  {section.label}
                </div>
              ) : null}
              {section.items.map((it) => (
                <Link
                  key={it.href + it.text}
                  to={it.href}
                  onClick={onClose}
                  className={`flex min-h-[44px] items-center gap-2 rounded-lg px-2 text-[15px] no-underline ${
                    it.emphasis ? "font-bold text-lotus-600" : "font-medium text-ink-600"
                  } hover:bg-lotus-50`}
                >
                  <span className="flex-1">{it.text}</span>
                  {it.badge ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-night px-2 py-0.5 text-[11px] font-bold text-lotus-200">
                      <BrandMark size={12} tone="white" />
                      {it.badge}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [drawerHeight, setDrawerHeight] = useState(null);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const navigate = useNavigate();
  const settings = useSiteSettings();
  const cms = useCmsNavData();
  const menus = buildMenus(cms);
  const { pathname } = useLocation();
  const activeKey = menus.find((m) => isMenuActive(m, pathname))?.key;

  const configuredLogo =
    settings?.branding?.logoUrl || settings?.branding?.logoWhiteUrl;
  const logoSrc = configuredLogo
    ? toWebsiteImageUrl(configuredLogo)
    : resolveWebsiteImage(settings, "/logo.png");

  const close = () => {
    setOpen(false);
    window.requestAnimationFrame(() => {
      menuButtonRef.current?.focus();
    });
  };

  useEffect(() => {
    if (!open || typeof window === "undefined") return undefined;

    const updateDrawerHeight = () => {
      setDrawerHeight(window.visualViewport?.height || window.innerHeight);
    };

    updateDrawerHeight();
    window.visualViewport?.addEventListener("resize", updateDrawerHeight);
    window.visualViewport?.addEventListener("scroll", updateDrawerHeight);
    window.addEventListener("resize", updateDrawerHeight);

    window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusableElements(drawerRef.current);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (
          document.activeElement === first ||
          document.activeElement === closeButtonRef.current
        ) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateDrawerHeight);
      window.visualViewport?.removeEventListener("scroll", updateDrawerHeight);
      window.removeEventListener("resize", updateDrawerHeight);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="block lg:hidden">
      {/* Hamburger */}
      <button
        type="button"
        ref={menuButtonRef}
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.2)",
          background: "rgba(255,255,255,0.1)",
          cursor: "pointer",
          color: "#fff",
        }}
        aria-label="Open menu"
      >
        <FiMenu size={18} />
      </button>

      {typeof document !== "undefined" &&
        ReactDOM.createPortal(
          <AnimatePresence>
            {open && (
              <>
                {/* Backdrop */}
                <motion.div
                  key="bd"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={close}
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 1199,
                    background: "rgba(0,0,0,0.45)",
                  }}
                />

                {/* Drawer */}
                <motion.div
                  key="drawer"
                  ref={drawerRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Main navigation"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                  style={{
                    position: "fixed",
                    top: 0,
                    right: 0,
                    zIndex: 1200,
                    width: "min(360px, 92vw)",
                    height: drawerHeight ? `${drawerHeight}px` : "100dvh",
                    maxHeight: "100dvh",
                    background: "#ffffff",
                    boxShadow: "-4px 0 40px rgba(0,0,0,0.25)",
                    display: "flex",
                    flexDirection: "column",
                    color: "#111827",
                    pointerEvents: "auto",
                  }}
                >
                  {/* Header strip */}
                  <div
                    style={{
                      flex: "0 0 68px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0 20px",
                      borderBottom: "1px solid #f0f0f0",
                      background: "#ffffff",
                    }}
                  >
                    <img
                      src={logoSrc}
                      alt="Expresso"
                      style={{
                        height: 38,
                        width: "auto",
                        objectFit: "contain",
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <button
                      type="button"
                      ref={closeButtonRef}
                      onClick={close}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                        background: "transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      aria-label="Close menu"
                    >
                      <FiX size={18} color="#6b7280" />
                    </button>
                  </div>

                  {/* Scrollable nav */}
                  <div
                    style={{
                      flex: "1 1 auto",
                      minHeight: 0,
                      overflowY: "auto",
                      padding: "0 20px",
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    {menus.map((m) => (
                      <NavRow key={m.key} menu={m} active={m.key === activeKey} onClose={close} />
                    ))}
                  </div>

                  {/* CTA strip */}
                  <div
                    className="flex flex-col gap-2 border-t border-ink-100 bg-mist px-5 pt-3"
                    style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/portal/login");
                        close();
                      }}
                      className="h-11 w-full rounded-full bg-lotus-400 text-[15px] font-bold text-night"
                    >
                      Client Portal
                    </button>
                    <Link
                      to="/vendor-registration"
                      onClick={close}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#EDE3D9] bg-sand text-[14px] font-bold text-espresso no-underline"
                    >
                      <BrandMark size={18} tone="espresso" />
                      Register as a vendor
                    </Link>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
