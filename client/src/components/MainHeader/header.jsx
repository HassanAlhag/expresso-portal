import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiChevronDown } from "react-icons/fi";
import MobileMenu from "./mobileMenu";
import MegaPanel from "./MegaPanel";
import { buildMenus, isMenuActive, useCmsNavData } from "./navData";
import BrandMark from "../../brand/BrandMark";
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

  const cms = useCmsNavData();
  const menus = useMemo(() => buildMenus(cms), [cms]);
  const { pathname } = useLocation();
  const activeKey = menus.find((m) => isMenuActive(m, pathname))?.key;
  const navRef = useRef(null);

  return (
    <header className="fixed inset-x-0 top-0 z-[1000] pointer-events-none">
      <nav
        ref={navRef}
        aria-label="Main"
        className="pointer-events-auto mx-auto mt-4 w-[min(1240px,96vw)] overflow-visible rounded-2xl border border-white/10 bg-night/60 px-4 py-2.5 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.45)] xl:px-5"
      >
        <div className="flex items-center justify-between gap-3">
          <Logo src={logoSrc} />

          <div className="hidden items-center gap-0.5 lg:flex xl:gap-1">
            {menus.map((m) => (
              <NavLink key={m.key} menu={m} active={m.key === activeKey} navRef={navRef} />
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
      aria-label="Expresso Digital — home"
      className="flex shrink-0 items-center gap-3 rounded-xl px-1 py-1"
    >
      <img
        src={src}
        alt="Expresso Digital"
        className="h-11 w-auto object-contain sm:h-12 xl:h-[52px]"
        draggable={false}
      />
    </Link>
  );
};

const NavLink = ({ menu, active, navRef }) => {
  const { text, href, width: flyoutWidth = 900 } = menu;
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(106);
  const timer = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const hasFlyout = true;

  // Position under the nav bar as it actually renders (handles browser zoom
  // and any change in nav height) instead of a hard-coded offset.
  useEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const bottom = navRef?.current?.getBoundingClientRect().bottom;
      if (bottom) setTop(Math.round(bottom + 10));
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, { passive: true });
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place);
    };
  }, [open, navRef]);
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
    setOpen(true);
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
    top: `${top}px`,
    left: `max(16px, calc(50vw - ${flyoutWidth / 2}px))`,
    width: `min(${flyoutWidth}px, calc(100vw - 32px))`,
    maxHeight: `calc(100vh - ${top + 16}px)`,
    overflowY: "auto",
    borderRadius: 22,
    zIndex: 1100,
  };

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <Link
        to={href}
        ref={triggerRef}
        id={triggerId}
        aria-haspopup={hasFlyout ? "true" : undefined}
        aria-expanded={hasFlyout ? open : undefined}
        aria-controls={hasFlyout ? panelId : undefined}
        onKeyDown={handleTriggerKeyDown}
        onBlur={handleTriggerBlur}
        aria-current={active ? "page" : undefined}
        className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-2 text-[13.5px] font-medium transition xl:px-3 xl:text-[14px] ${
          active || open ? "bg-lotus-400/15 text-white" : "text-white/80 hover:text-white"
        }`}
      >
        {active ? <BrandMark size={15} tone="lotus-300" /> : null}
        {text}
        <FiChevronDown
          size={13}
          aria-hidden="true"
          className={`hidden text-white/50 transition-transform xl:inline ${open ? "rotate-180" : ""}`}
        />
      </Link>

      {/* transparent bridge fills the gap between nav bar and flyout panel */}
      {open && (
        <div
          className="fixed left-0 right-0"
          style={{ top: top - 24, height: 28, zIndex: 1099 }}
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
                <MegaPanel menu={menu} />
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
        type="button"
        onClick={() => navigate("/portal/login")}
        className="whitespace-nowrap rounded-full bg-lotus-400 px-5 py-2.5 text-[14px] font-bold text-night transition hover:bg-lotus-300"
      >
        Client Portal
      </button>
    </div>
  );
};

export default Header;
