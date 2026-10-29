import { useCallback, useEffect, useState } from "react";

const BASE = process.env.REACT_APP_API_URL || "/api";

// Public Portfolio work items (/api/work). Case studies are a separate
// source (usePortfolioItems → /api/portfolio). A failed or invalid response
// rejects and is never cached, so pages can tell "no work yet" from "request
// failed".
let _cache = null;
let _promise = null;

async function fetchPublishedWork() {
  if (_cache) return _cache;
  if (!_promise) {
    _promise = fetch(`${BASE}/work?limit=100&sort=sortOrder`)
      .then((r) => {
        if (!r.ok) throw new Error(`Work request failed: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data?.ok === false || !Array.isArray(data?.items)) throw new Error("Invalid work response");
        _cache = data.items;
        return _cache;
      })
      .finally(() => {
        _promise = null;
      });
  }
  return _promise;
}

export function invalidateWorkCache() {
  _cache = null;
  _promise = null;
}

export function useWorkItems() {
  const [state, setState] = useState(() => ({ items: _cache || [], loading: !_cache, error: null }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let mounted = true;
    setState((prev) => ({ ...prev, loading: !_cache, error: null }));
    fetchPublishedWork()
      .then((items) => { if (mounted) setState({ items, loading: false, error: null }); })
      .catch((error) => { if (mounted) setState({ items: [], loading: false, error }); });
    return () => { mounted = false; };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}

/** One published work item by slug. HTTP 404 means "not found"; other failures can be retried. */
export function useWorkItem(slug) {
  const [state, setState] = useState({ item: null, loading: true, error: null, notFound: false });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!slug) return undefined;
    let mounted = true;
    setState({ item: null, loading: true, error: null, notFound: false });
    fetch(`${BASE}/work/${encodeURIComponent(slug)}`)
      .then((r) => {
        if (r.status === 404) return { notFound: true };
        if (!r.ok) throw new Error(`Work item request failed: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!mounted) return;
        if (data?.notFound || (data?.ok !== false && !data?.item)) {
          setState({ item: null, loading: false, error: null, notFound: true });
          return;
        }
        if (data?.ok === false) throw new Error("Invalid work item response");
        setState({ item: data.item, loading: false, error: null, notFound: false });
      })
      .catch((error) => { if (mounted) setState({ item: null, loading: false, error, notFound: false }); });
    return () => { mounted = false; };
  }, [slug, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}
