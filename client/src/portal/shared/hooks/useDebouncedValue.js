import { useEffect, useState } from "react";

// Debounced value for search fields (PUI-3): list pages search on the server
// after the user pauses typing, not on every keystroke.
export default function useDebouncedValue(value, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}
