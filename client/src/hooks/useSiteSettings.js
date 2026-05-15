import { useEffect, useState } from "react";
import { getPublicSiteSettings } from "../api/siteSettings";

const CACHE_TTL_MS = 30 * 1000;
const STORAGE_KEY = "expresso_site_settings_v2";
const BROADCAST_KEY = "expresso_site_settings_updated_at";
export const SITE_SETTINGS_UPDATED_EVENT = "expresso:site-settings-updated";

// Module-level in-memory cache (cleared on page refresh)
let _cache = null;
let _cachedAt = 0;
let _promise = null;

// ─── SessionStorage helpers ───────────────────────────────────────────────────
// Persists settings across page refreshes so the first render is instant.

function readStorageArea(storage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { data, at } = JSON.parse(raw);
    if (!data || Date.now() - at > CACHE_TTL_MS) return null;
    return { data, at };
  } catch {
    return null;
  }
}

function readStorage() {
  const local =
    typeof window !== "undefined" ? window.localStorage : null;
  const session =
    typeof window !== "undefined" ? window.sessionStorage : null;

  return (
    readStorageArea(local) ||
    readStorageArea(session)
  );
}

function writeStorage(data, at) {
  const payload = JSON.stringify({ data, at });
  const local =
    typeof window !== "undefined" ? window.localStorage : null;
  const session =
    typeof window !== "undefined" ? window.sessionStorage : null;

  try {
    local?.setItem(STORAGE_KEY, payload);
  } catch {
    /* ignore quota/SSR errors */
  }

  try {
    session?.setItem(STORAGE_KEY, payload);
  } catch {
    /* ignore quota/SSR errors */
  }
}

function applyCachedSettings(data, at = Date.now()) {
  const next = data && typeof data === "object" ? data : {};

  _cache = next;
  _cachedAt = at;
  _promise = null;
  writeStorage(next, at);

  return next;
}

// ─── Cache logic ──────────────────────────────────────────────────────────────

function isCacheFresh() {
  return _cache !== null && Date.now() - _cachedAt < CACHE_TTL_MS;
}

function getInitialSettings() {
  // 1. In-memory cache (fast path for SPA navigation)
  if (isCacheFresh()) return _cache;

  // 2. SessionStorage (survives page refreshes — synchronous, no API call needed)
  const stored = readStorage();
  if (stored) {
    _cache = stored.data;
    _cachedAt = stored.at;
    return stored.data;
  }

  return {};
}

function ensurePromise({ force = false } = {}) {
  if (!force && isCacheFresh()) return Promise.resolve(_cache);
  if (_promise) return _promise;

  _promise = getPublicSiteSettings()
    .then((s) => {
      return applyCachedSettings(s);
    })
    .catch(() => {
      _promise = null;
      return _cache || {};
    });

  return _promise;
}

export function updateSiteSettingsCache(settings, { broadcast = false } = {}) {
  const next = applyCachedSettings(settings);

  try {
    window.dispatchEvent(
      new CustomEvent(SITE_SETTINGS_UPDATED_EVENT, {
        detail: { settings: next, at: _cachedAt },
      })
    );
  } catch {
    /* ignore non-browser contexts */
  }

  if (broadcast) {
    try {
      window.localStorage.setItem(BROADCAST_KEY, String(_cachedAt));
    } catch {
      /* ignore quota/SSR errors */
    }
  }

  return next;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSiteSettings() {
  const [settings, setSettings] = useState(getInitialSettings);

  useEffect(() => {
    let mounted = true;

    const setIfMounted = (next) => {
      if (mounted) setSettings(next || {});
    };

    ensurePromise().then(setIfMounted);
    ensurePromise({ force: true }).then(setIfMounted);

    const handleSettingsEvent = (event) => {
      const eventSettings = event?.detail?.settings;
      if (eventSettings) {
        setIfMounted(applyCachedSettings(eventSettings, event?.detail?.at));
        return;
      }

      ensurePromise({ force: true }).then(setIfMounted);
    };

    const handleStorage = (event) => {
      if (event.key === BROADCAST_KEY || event.key === STORAGE_KEY) {
        ensurePromise({ force: true }).then(setIfMounted);
      }
    };

    window.addEventListener(SITE_SETTINGS_UPDATED_EVENT, handleSettingsEvent);
    window.addEventListener("storage", handleStorage);

    return () => {
      mounted = false;
      window.removeEventListener(SITE_SETTINGS_UPDATED_EVENT, handleSettingsEvent);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return settings;
}
