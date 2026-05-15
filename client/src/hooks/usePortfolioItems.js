import { useEffect, useState } from "react";

const BASE = process.env.REACT_APP_API_URL || "/api";

let _cache = null;
let _promise = null;

async function fetchPublishedItems() {
  if (_cache) return _cache;
  if (_promise) return _promise;

  _promise = fetch(`${BASE}/portfolio?status=published&limit=50&sort=sortOrder`)
    .then((r) => r.json())
    .then((data) => {
      _cache = Array.isArray(data?.items) ? data.items : [];
      _promise = null;
      return _cache;
    })
    .catch(() => {
      _promise = null;
      return [];
    });

  return _promise;
}

export function invalidatePortfolioCache() {
  _cache = null;
  _promise = null;
}

export function usePortfolioItems() {
  const [items, setItems] = useState(_cache || []);
  const [loading, setLoading] = useState(!_cache);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchPublishedItems()
      .then((data) => { if (mounted) { setItems(data); setLoading(false); } })
      .catch((err) => { if (mounted) { setError(err); setLoading(false); } });
    return () => { mounted = false; };
  }, []);

  return { items, loading, error };
}
