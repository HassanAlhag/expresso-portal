import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Image lightbox. Pass onPrev/onNext (and optionally `position`, e.g.
// "2 / 6") to browse a set: arrow buttons and the ← → keys move between
// images. Without them it shows a single image, as before.
export default function Lightbox({ open, onClose, src, alt = "", onPrev, onNext, position = "" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      else if (e.key === "ArrowLeft" && onPrev) onPrev();
      else if (e.key === "ArrowRight" && onNext) onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onPrev, onNext]);

  const arrow =
    "absolute top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/45 text-xl text-white backdrop-blur transition hover:bg-black/65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

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
          aria-label={alt || "Image"}
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
            {position ? (
              <span className="absolute left-3 top-3 z-20 rounded-full border border-white/15 bg-black/40 px-3 py-2 text-xs font-semibold text-white">
                {position}
              </span>
            ) : null}

            <div className="relative aspect-[16/9] w-full bg-black/30">
              {src ? (
                <img
                  key={src}
                  src={src}
                  alt={alt}
                  className="absolute inset-0 h-full w-full object-contain"
                  draggable={false}
                />
              ) : null}
            </div>

            {onPrev ? (
              <button type="button" onClick={onPrev} aria-label="Previous image" className={`${arrow} left-3`}>
                <span aria-hidden="true">‹</span>
              </button>
            ) : null}
            {onNext ? (
              <button type="button" onClick={onNext} aria-label="Next image" className={`${arrow} right-3`}>
                <span aria-hidden="true">›</span>
              </button>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
