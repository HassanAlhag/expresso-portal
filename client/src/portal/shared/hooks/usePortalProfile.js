// src/portal/hooks/usePortalProfile.js
import { useEffect, useState, useCallback, useRef } from "react";
import { getProfile, updateProfile } from "../../api/profile.api";

const REQUEST_TIMEOUT_MS = 15000;
const LS_ONBOARDED_KEY = "portal_onboarded";

function withTimeout(promise, ms = REQUEST_TIMEOUT_MS, label = "Request") {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function readLocalOnboarded() {
  return localStorage.getItem(LS_ONBOARDED_KEY) === "1";
}

function writeLocalOnboarded(v) {
  if (v) localStorage.setItem(LS_ONBOARDED_KEY, "1");
  else localStorage.removeItem(LS_ONBOARDED_KEY);
}

export function usePortalProfile() {
  const [profile, setProfile] = useState(null);
  const [onboarded, setOnboarded] = useState(readLocalOnboarded());
  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await withTimeout(
        getProfile(),
        REQUEST_TIMEOUT_MS,
        "getProfile"
      );
      if (!mountedRef.current) return;

      setProfile(res?.profile || {});

      // ✅ only trust onboarded if server returns a boolean
      if (typeof res?.onboarded === "boolean") {
        setOnboarded(res.onboarded);
        writeLocalOnboarded(res.onboarded);
      } else {
        // fallback: keep local value
        setOnboarded(readLocalOnboarded());
      }
    } catch {
      if (!mountedRef.current) return;

      setProfile({});
      // keep local fallback (don’t force false and break UX)
      setOnboarded(readLocalOnboarded());
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    async (nextProfile, options = {}) => {
      const prevProfile = profile;
      const prevOnboarded = onboarded;

      // optimistic UI
      setProfile(nextProfile);

      // if onboarding was finished/skipped, set immediately (and persist locally)
      if (typeof options.setOnboardedTo === "boolean") {
        setOnboarded(options.setOnboardedTo);
        writeLocalOnboarded(options.setOnboardedTo);
      }

      try {
        const res = await withTimeout(
          updateProfile({
            profile: nextProfile,
            onboarded:
              typeof options.setOnboardedTo === "boolean"
                ? options.setOnboardedTo
                : undefined,
          }),
          REQUEST_TIMEOUT_MS,
          "updateProfile"
        );

        if (!mountedRef.current) return res;

        setProfile(res?.profile || {});

        // ✅ only overwrite onboarded if backend returns a boolean
        if (typeof res?.onboarded === "boolean") {
          setOnboarded(res.onboarded);
          writeLocalOnboarded(res.onboarded);
        }

        return res;
      } catch (e) {
        // rollback
        if (mountedRef.current) {
          setProfile(prevProfile ?? {});
          setOnboarded(Boolean(prevOnboarded));
          writeLocalOnboarded(Boolean(prevOnboarded));
        }
        throw e;
      }
    },
    [profile, onboarded]
  );

  return { profile: profile || {}, onboarded, loading, save, refresh };
}
