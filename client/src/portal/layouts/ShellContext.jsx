import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

// Lets a page hand its breadcrumb trail to the shell's top bar. Pages that
// don't set one get a trail derived from the route (see PortalLayout).
const ShellContext = createContext(null);

export function ShellProvider({ children }) {
  const [crumbs, setCrumbs] = useState(null);
  const value = useMemo(() => ({ crumbs, setCrumbs }), [crumbs]);
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell() {
  return useContext(ShellContext);
}

/** Publish breadcrumbs for the current page; cleared when the page unmounts. */
export function usePageCrumbs(items) {
  const shell = useShell();
  const key = JSON.stringify((items || []).map((i) => [i.label, i.to || ""]));
  useEffect(() => {
    if (!shell || !items?.length) return undefined;
    shell.setCrumbs(items);
    return () => shell.setCrumbs(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
