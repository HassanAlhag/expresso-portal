import { useCallback, useEffect, useState } from "react";

const BASE = process.env.REACT_APP_API_URL || "/api";

// A single case study. HTTP 404 (or a successful response without an item)
// means "not found"; any other failure is an error the page can retry.
export function usePortfolioItem(id) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    setItem(null);
    setError(null);
    setNotFound(false);

    fetch(`${BASE}/portfolio/${id}`)
      .then((r) => {
        if (r.status === 404) return { notFound: true };
        if (!r.ok) throw new Error(`Portfolio item request failed: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!mounted) return;
        if (data?.notFound) { setNotFound(true); setLoading(false); return; }
        if (data?.ok === false) throw new Error("Invalid portfolio item response");
        if (!data?.item) setNotFound(true);
        else setItem(data.item);
        setLoading(false);
      })
      .catch((err) => {
        if (mounted) { setError(err); setLoading(false); }
      });

    return () => { mounted = false; };
  }, [id, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { item, loading, error, notFound, retry };
}
