import { useEffect, useState } from "react";
import { mergeDigitalProducts } from "../data/coreDigitalProducts";

const API = process.env.REACT_APP_API_URL || "/api";

// Both public views reuse the existing CMS endpoint and core merge rules.
// Late responses cannot update an unmounted view.
export default function useDigitalProducts() {
  const [cmsProducts, setCmsProducts] = useState(null);
  const [error, setError] = useState(false);
  const [requestKey, setRequestKey] = useState(0);
  useEffect(() => {
    let alive = true;
    setCmsProducts(null);
    setError(false);
    fetch(`${API}/web-content/solutions?kind=digital`)
      .then((response) => {
        if (!response.ok) throw new Error(`Solutions request failed: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (data?.ok === false || !Array.isArray(data?.items)) throw new Error("Invalid solutions response");
        if (alive) setCmsProducts(data.items);
      })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [requestKey]);
  return {
    products: mergeDigitalProducts(cmsProducts || []),
    loading: cmsProducts === null && !error,
    error,
    retry: () => setRequestKey((key) => key + 1),
  };
}
