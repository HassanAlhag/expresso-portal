import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Lightbox({ open, onClose, src, alt = "" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[9999] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

          {/* Content */}
          <motion.div
            className="relative z-10 w-[min(1100px,96vw)] overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-[0_40px_120px_rgba(0,0,0,0.6)]"
            initial={{ scale: 0.96, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-20 rounded-full border border-white/15 bg-black/40 px-3 py-2 text-xs text-white hover:bg-black/55 transition"
            >
              Close ✕
            </button>

            <div className="relative aspect-[16/9] w-full bg-black/30">
              {src ? (
                <img
                  src={src}
                  alt={alt}
                  className="absolute inset-0 h-full w-full object-contain"
                  draggable={false}
                />
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
