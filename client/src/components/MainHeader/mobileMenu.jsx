import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FiMenu, FiX, FiChevronDown } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import LINKS from "./links";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import {
  resolveWebsiteImage,
  toWebsiteImageUrl,
} from "../../utils/websiteImages";

const NAV = LINKS.map(({ text, href, mobileLinks = [] }) => ({
  text,
  href,
  sub: mobileLinks,
}));

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

function NavRow({ item, onClose }) {
  const [open, setOpen] = useState(false);
  const hasSub = item.sub && item.sub.length > 0;
  const toggleId = `${toMenuId(item.text)}-toggle`;
  const submenuId = `${toMenuId(item.text)}-submenu`;

  return (
    <div style={{ borderBottom: "1px solid #e5e7eb" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 0",
        }}
      >
        <Link
          to={item.href}
          onClick={onClose}
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "#111827",
            textDecoration: "none",
          }}
        >
          {item.text}
        </Link>
        {hasSub && (
          <button
            type="button"
            id={toggleId}
            aria-expanded={open}
            aria-controls={submenuId}
            aria-label={`${open ? "Collapse" : "Expand"} ${item.text}`}
            onClick={() => setOpen((v) => !v)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              border: "none",
              background: "#f3f4f6",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiChevronDown
              size={16}
              color="#6b7280"
              style={{
                transition: "transform 0.22s",
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>
        )}
      </div>

      {hasSub && open && (
        <div
          id={submenuId}
          role="region"
          aria-labelledby={toggleId}
          style={{ paddingBottom: 8 }}
        >
          {item.sub.map((s) => (
            <Link
              key={s.href}
              to={s.href}
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0 10px 8px",
                fontSize: 14,
                fontWeight: 500,
                color: "#4b5563",
                textDecoration: "none",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: s.badge ? "#7F8AD1" : "#818cf8",
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: "1 1 auto" }}>{s.text}</span>
              {s.badge && (
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 9.5,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "#5762b8",
                    background: "rgba(127,138,209,0.12)",
                    border: "1px solid rgba(127,138,209,0.25)",
                    borderRadius: 999,
                    padding: "2px 7px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.badge}
                </span>
              )}
            </Link>
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
                    {NAV.map((item) => (
                      <NavRow key={item.text} item={item} onClose={close} />
                    ))}
                  </div>

                  {/* CTA strip */}
                  <div
                    style={{
                      flex: "0 0 auto",
                      display: "flex",
                      alignItems: "center",
                      padding:
                        "12px 20px calc(12px + env(safe-area-inset-bottom, 0px))",
                      borderTop: "1px solid #f0f0f0",
                      background: "#f9fafb",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/portal/login");
                        close();
                      }}
                      style={{
                        width: "100%",
                        height: 44,
                        borderRadius: 12,
                        border: "none",
                        background: "#6366f1",
                        color: "#ffffff",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Client Portal
                    </button>
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
