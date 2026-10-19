import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import LINKS from "./links";
import MobileMenu from "./mobileMenu";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import {
  resolveWebsiteImage,
  toWebsiteImageUrl,
} from "../../utils/websiteImages";

const LOGO_FALLBACK = "/white-logo.png";

const toMenuId = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const focusFirstFocusable = (root) => {
  if (!root) return;

  const focusable = root.querySelector(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (focusable) focusable.focus();
};

const Header = () => {
  const settings = useSiteSettings();
  const logoSrc = settings?.branding?.logoWhiteUrl
    ? toWebsiteImageUrl(settings.branding.logoWhiteUrl)
    : resolveWebsiteImage(settings, LOGO_FALLBACK);

  return (
    <header className="fixed inset-x-0 top-0 z-[1000] pointer-events-none">
      <nav className="pointer-events-auto mx-auto mt-4 w-[min(1180px,94vw)] overflow-visible rounded-2xl border border-white/10 bg-black/35 px-5 py-3 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between gap-4">
          <Logo src={logoSrc} />

          <div className="hidden items-center gap-7 lg:flex">
            {LINKS.map((l) => (
              <NavLink key={l.text} {...l} />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:block">
              <CTAs />
            </div>
            <MobileMenu />
          </div>
        </div>
      </nav>
    </header>
  );
};

const Logo = ({ src }) => {
  return (
    <Link
      to="/"
      className="flex items-center gap-3 rounded-xl px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-300/60"
    >
      <img
        src={src}
        alt="Expresso Digital"
        className="h-11 w-auto object-contain sm:h-12 md:h-14"
        draggable={false}
      />
    </Link>
  );
};

const NavLink = ({ text, href, FlyoutContent, flyoutWidth = 800 }) => {
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const hasFlyout = Boolean(FlyoutContent);
  const triggerId = `${toMenuId(text)}-trigger`;
  const panelId = `${toMenuId(text)}-flyout`;

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const clearCloseTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const show = () => {
    clearCloseTimer();
    if (hasFlyout) setOpen(true);
  };
  const hide = () => {
    clearCloseTimer();
    timer.current = setTimeout(() => setOpen(false), 220);
  };

  const closeMenu = (restoreFocus = false) => {
    clearCloseTimer();
    setOpen(false);

    if (restoreFocus) {
      window.requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  };

  const openMenuFromKeyboard = (focusFirst = false) => {
    clearCloseTimer();
    if (!hasFlyout) return;

    setOpen(true);
    if (focusFirst) {
      window.requestAnimationFrame(() => {
        focusFirstFocusable(panelRef.current);
      });
    }
  };

  const handleTriggerKeyDown = (event) => {
    if (!hasFlyout) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMenuFromKeyboard(false);
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      openMenuFromKeyboard(true);
    }

    if (event.key === "Escape" && open) {
      event.preventDefault();
      closeMenu(true);
    }
  };

  const handleTriggerBlur = (event) => {
    if (!hasFlyout) return;

    const next = event.relatedTarget;
    if (next && panelRef.current?.contains(next)) return;

    hide();
  };

  const handlePanelBlur = (event) => {
    const next = event.relatedTarget;
    if (
      next &&
      (panelRef.current?.contains(next) || triggerRef.current?.contains(next))
    ) {
      return;
    }

    hide();
  };

  const handlePanelKeyDown = (event) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      closeMenu(true);
    }
  };

  // Center the panel on the viewport without any CSS transform.
  // left = 50vw - half the menu width, clamped to 16px so it never bleeds off screen.
  const flyoutStyle = {
    position: "fixed",
    top: "106px",
    left: `max(16px, calc(50vw - ${flyoutWidth / 2}px))`,
    width: `min(${flyoutWidth}px, calc(100vw - 32px))`,
    zIndex: 1100,
  };

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <Link
        to={href}
        ref={triggerRef}
        id={triggerId}
        aria-haspopup={hasFlyout ? "menu" : undefined}
        aria-expanded={hasFlyout ? open : undefined}
        aria-controls={hasFlyout ? panelId : undefined}
        onKeyDown={handleTriggerKeyDown}
        onBlur={handleTriggerBlur}
        className="relative text-[14px] font-medium text-white/85 transition hover:text-white"
      >
        {text}
      </Link>

      {/* transparent bridge fills the gap between nav bar and flyout panel */}
      {hasFlyout && open && (
        <div
          className="fixed left-0 right-0"
          style={{ top: 72, height: 40, zIndex: 1099 }}
          onMouseEnter={show}
        />
      )}

      {hasFlyout &&
        ReactDOM.createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={panelRef}
                id={panelId}
                aria-labelledby={triggerId}
                onFocus={clearCloseTimer}
                onMouseEnter={show}
                onMouseLeave={hide}
                onBlur={handlePanelBlur}
                onKeyDown={handlePanelKeyDown}
                style={flyoutStyle}
                initial={{ opacity: 0, y: 6, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.99 }}
                transition={{ duration: 0.15 }}
              >
                <div className="rounded-2xl border border-white/10 bg-white/5 p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
                  <FlyoutContent />
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

export const CTAs = () => {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate("/portal/login")}
        className="rounded-xl border border-indigo-300/40 bg-indigo-300/85 px-5 py-2.5 text-[13px] font-semibold text-black transition hover:bg-indigo-300"
      >
        Client Portal
      </button>
    </div>
  );
};

export default Header;
