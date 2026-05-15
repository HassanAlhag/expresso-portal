import { useEffect, useState } from "react";

const BASE = process.env.REACT_APP_API_URL || "/api";

export function usePortfolioItem(id) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    setItem(null);
    setError(null);

    fetch(`${BASE}/portfolio/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (mounted) {
          setItem(data?.item || null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) { setError(err); setLoading(false); }
      });

    return () => { mounted = false; };
  }, [id]);

  return { item, loading, error };
}
