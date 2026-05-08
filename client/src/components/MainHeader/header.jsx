import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import LINKS from "./links";
import { useSiteSettings } from "../../hooks/useSiteSettings";

const LOGO_FALLBACK = "/white-logo.png";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const settings = useSiteSettings();
  const logoSrc = settings?.branding?.logoWhiteUrl || LOGO_FALLBACK;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-[1000]">
      <div
        className={[
          "w-full transition-all duration-300",
          scrolled
            ? "bg-[rgba(5,6,10,0.88)] shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl"
            : "bg-transparent",
        ].join(" ")}
      >
        <nav className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-6 py-3 lg:px-10">
          <Logo src={logoSrc} />

          <div className="hidden items-center gap-7 md:flex">
            {LINKS.map((l) => (
              <NavLink key={l.text} {...l} scrolled={scrolled} />
            ))}
          </div>

          <CTAs />
        </nav>
      </div>
    </header>
  );
};

const Logo = ({ src }) => (
  <Link
    to="/"
    className="flex items-center gap-3 rounded-xl px-1 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-300/60"
  >
    <img
      src={src}
      alt="Expresso Digital"
      className="h-11 w-auto object-contain sm:h-12 md:h-14"
      draggable={false}
    />
  </Link>
);

const NavLink = ({ text, href, FlyoutContent, flyoutWidth = 800, scrolled }) => {
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  const hasFlyout = Boolean(FlyoutContent);

  const show = () => { clearTimeout(timer.current); if (hasFlyout) setOpen(true); };
  const hide = () => { timer.current = setTimeout(() => setOpen(false), 120); };

  const flyoutStyle = {
    position: "fixed",
    top: "72px",
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

      {hasFlyout && ReactDOM.createPortal(
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
              <div className="rounded-2xl border border-white/10 bg-[rgba(8,10,18,0.92)] p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
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
