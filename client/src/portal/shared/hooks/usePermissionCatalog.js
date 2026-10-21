// src/portal/shared/hooks/usePermissionCatalog.js
// The permission catalog comes from the API (GET /api/permissions/catalog),
// which is the only source of permission keys, labels, built-in role defaults
// and the permissions client/vendor roles can never hold. The portal keeps no
// copy of its own, so it cannot drift from what the server enforces.
import { useEffect, useState } from "react";
import { api } from "../api/client";

let cached = null;
let inflight = null;

export function fetchPermissionCatalog() {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = api
      .get("/permissions/catalog")
      .then(({ data }) => {
        const catalog = Array.isArray(data?.catalog) ? data.catalog : [];
        cached = {
          catalog,
          allKeys: Array.isArray(data?.allKeys)
            ? data.allKeys
            : catalog.flatMap((d) => (d.permissions || []).map((p) => p.key)),
          defaults: data?.defaults || {},
          externalDeniedPrefixes: Array.isArray(data?.externalDeniedPrefixes) ? data.externalDeniedPrefixes : [],
        };
        return cached;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Same rule as the API's isExternalDenied (utils/roleRegistry.js). */
export function isExternalDeniedKey(key, prefixes = []) {
  return prefixes.some((prefix) => key === prefix || key.startsWith(prefix));
}

export function usePermissionCatalog() {
  const [state, setState] = useState(() => ({
    ...(cached || { catalog: [], allKeys: [], defaults: {}, externalDeniedPrefixes: [] }),
    loading: !cached,
    error: "",
  }));

  useEffect(() => {
    if (cached) return undefined;
    let alive = true;
    fetchPermissionCatalog()
      .then((value) => {
        if (alive) setState({ ...value, loading: false, error: "" });
      })
      .catch((e) => {
        if (alive) {
          setState((s) => ({
            ...s,
            loading: false,
            error: e?.response?.data?.message || "Could not load the permission list. Try again.",
          }));
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

/** Test helper: forget the cached catalog. */
export function resetPermissionCatalogCache() {
  cached = null;
  inflight = null;
}
