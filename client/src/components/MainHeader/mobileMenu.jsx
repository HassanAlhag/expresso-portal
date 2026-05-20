import React, { useEffect, useState } from "react";
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

function NavRow({ item, onClose }) {
  const [open, setOpen] = useState(false);
  const hasSub = item.sub && item.sub.length > 0;

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
        <div style={{ paddingBottom: 8 }}>
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
                  background: "#818cf8",
                  flexShrink: 0,
                }}
              />
              {s.text}
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
  const navigate = useNavigate();
  const settings = useSiteSettings();

  const configuredLogo =
    settings?.branding?.logoUrl || settings?.branding?.logoWhiteUrl;
  const logoSrc = configuredLogo
    ? toWebsiteImageUrl(configuredLogo)
    : resolveWebsiteImage(settings, "/logo.png");

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open || typeof window === "undefined") return undefined;

    const updateDrawerHeight = () => {
      setDrawerHeight(window.visualViewport?.height || window.innerHeight);
    };

    updateDrawerHeight();
    window.visualViewport?.addEventListener("resize", updateDrawerHeight);
    window.visualViewport?.addEventListener("scroll", updateDrawerHeight);
    window.addEventListener("resize", updateDrawerHeight);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateDrawerHeight);
      window.visualViewport?.removeEventListener("scroll", updateDrawerHeight);
      window.removeEventListener("resize", updateDrawerHeight);
    };
  }, [open]);

  return (
    <div className="block lg:hidden">
      {/* Hamburger */}
      <button
        type="button"
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
