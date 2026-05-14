import { useEffect, useState } from "react";
import { getPublicSiteSettings } from "../api/siteSettings";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = "expresso_site_settings_v1";

// Module-level in-memory cache (cleared on page refresh)
let _cache = null;
let _cachedAt = 0;
let _promise = null;

// ─── SessionStorage helpers ───────────────────────────────────────────────────
// Persists settings across page refreshes so the first render is instant.

function readStorage() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { data, at } = JSON.parse(raw);
    if (!data || Date.now() - at > CACHE_TTL_MS) return null;
    return { data, at };
  } catch {
    return null;
  }
}

function writeStorage(data, at) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ data, at }));
  } catch { /* ignore quota/SSR errors */ }
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

function ensurePromise() {
  if (isCacheFresh()) return Promise.resolve(_cache);
  if (_promise) return _promise;

  _promise = getPublicSiteSettings()
    .then((s) => {
      _cache = s;
      _cachedAt = Date.now();
      _promise = null;
      writeStorage(s, _cachedAt);
      return s;
    })
    .catch(() => {
      _promise = null;
      return _cache || {};
    });

  return _promise;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSiteSettings() {
  const [settings, setSettings] = useState(getInitialSettings);

  useEffect(() => {
    ensurePromise().then((s) => setSettings(s));
  }, []);

  return settings;
}
