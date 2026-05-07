import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";

const CommandBarCtx = createContext(null);

export function useCommandBar() {
  return useContext(CommandBarCtx);
}

export function CommandBarProvider({ children, getItems }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  // hotkey: cmd/ctrl + k
  useEffect(() => {
    const onKeyDown = (e) => {
      const isK = e.key.toLowerCase() === "k";
      if ((e.metaKey || e.ctrlKey) && isK) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const items = useMemo(() => {
    const all = (getItems?.() || []).filter(Boolean);
    const qq = q.trim().toLowerCase();
    if (!qq) return all;
    return all.filter((it) => {
      const hay = `${it.label} ${it.keywords || ""}`.toLowerCase();
      return hay.includes(qq);
    });
  }, [q, getItems]);

  const run = (item) => {
    if (!item) return;
    if (item.onSelect) return item.onSelect();
    if (item.to) nav(item.to);
    setOpen(false);
    setQ("");
  };

  return (
    <CommandBarCtx.Provider value={{ open, setOpen }}>
      {children}

      {open ? (
        <div
          className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm p-4 flex items-start justify-center"
          onMouseDown={() => setOpen(false)}
        >
          <div
            className="w-[min(900px,96vw)] portal-glass p-4 mt-12"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-3">
              <Search size={16} className="text-slate-500" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search actions… (Clients, Jobs, Tickets, Create…) "
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 py-3"
              />
              <span className="portal-kbd">ESC</span>
            </div>

            <div className="mt-2 max-h-[360px] overflow-y-auto no-scrollbar">
              {(items || []).length === 0 ? (
                <div className="px-3 py-4 text-sm text-slate-500">
                  No results.
                </div>
              ) : (
                items.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => run(it)}
                    className="w-full text-left px-3 py-3 rounded-2xl hover:bg-black/[0.03] transition flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">
                        {it.label}
                      </div>
                      {it.hint ? (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {it.hint}
                        </div>
                      ) : null}
                    </div>
                    <ArrowRight size={16} className="text-slate-400" />
                  </button>
                ))
              )}
            </div>

            <div className="mt-3 px-3 text-xs text-slate-500 flex items-center justify-between">
              <span>Tip: press ⌘K anytime</span>
              <span className="portal-kbd">↵</span>
            </div>
          </div>
        </div>
      ) : null}
    </CommandBarCtx.Provider>
  );
}
