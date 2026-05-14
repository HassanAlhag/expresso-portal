import React, { useRef, useState } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import LINKS from "./links";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImage, toWebsiteImageUrl } from "../../utils/websiteImages";

const LOGO_FALLBACK = "/white-logo.png";

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

          <div className="hidden items-center gap-7 md:flex">
            {LINKS.map((l) => (
              <NavLink key={l.text} {...l} />
            ))}
          </div>

          <CTAs />
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
  const hasFlyout = Boolean(FlyoutContent);

  const show = () => {
    clearTimeout(timer.current);
    if (hasFlyout) setOpen(true);
  };
  const hide = () => {
    timer.current = setTimeout(() => setOpen(false), 120);
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
        className="relative text-[14px] font-medium text-white/85 transition hover:text-white"
      >
        {text}
      </Link>

      {hasFlyout &&
        ReactDOM.createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                onMouseEnter={show}
                onMouseLeave={hide}
                style={flyoutStyle}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.18 }}
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

const CTAs = () => {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate("/contact-us")}
        className="rounded-xl border border-indigo-300/40 bg-indigo-300/85 px-5 py-2.5 text-[13px] font-semibold text-black transition hover:bg-indigo-300"
      >
        Schedule a Demo
      </button>
    </div>
  );
};

export default Header;
