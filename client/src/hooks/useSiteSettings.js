import { useEffect, useState } from "react";
import { getPublicSiteSettings } from "../api/siteSettings";

// Module-level cache so we only fetch once per page load
let _cache = null;
let _promise = null;

export function useSiteSettings() {
  const [settings, setSettings] = useState(_cache || {});

  useEffect(() => {
    if (_cache) return;
    if (!_promise) {
      _promise = getPublicSiteSettings()
        .then((s) => { _cache = s; return s; })
        .catch(() => ({}));
    }
    _promise.then((s) => setSettings(s));
  }, []);

  return settings;
}
