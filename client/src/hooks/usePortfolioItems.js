import { useCallback, useEffect, useState } from "react";

const BASE = process.env.REACT_APP_API_URL || "/api";

let _cache = null;
let _promise = null;

// Shared published-portfolio list. A failed or invalid response rejects (and is
// never cached), so pages can tell "no portfolio records" from "request failed".
async function fetchPublishedItems() {
  if (_cache) return _cache;
  if (!_promise) {
    _promise = fetch(`${BASE}/portfolio?status=published&limit=50&sort=sortOrder`)
      .then((r) => {
        if (!r.ok) throw new Error(`Portfolio request failed: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data?.ok === false || !Array.isArray(data?.items)) throw new Error("Invalid portfolio response");
        _cache = data.items;
        return _cache;
      })
      .finally(() => {
        _promise = null;
      });
  }
  return _promise;
}

export function invalidatePortfolioCache() {
  _cache = null;
  _promise = null;
}

export function usePortfolioItems() {
  const [state, setState] = useState(() => ({ items: _cache || [], loading: !_cache, error: null }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let mounted = true;
    setState((prev) => ({ ...prev, loading: !_cache, error: null }));
    fetchPublishedItems()
      .then((items) => { if (mounted) setState({ items, loading: false, error: null }); })
      .catch((error) => { if (mounted) setState({ items: [], loading: false, error }); });
    return () => { mounted = false; };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}
