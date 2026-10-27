// Shared helpers for the PI closure tests (older-page permission alignment).
// Not a test file: CRA runs only *.test.js(x); the ".test." infix keeps it
// out of the architecture inventory like other test code.
import React from "react";
import { render } from "@testing-library/react";
import { ToastProvider } from "../shared/ui/Toast";

const token = (role) => `x.${btoa(JSON.stringify({ id: "u1", role }))}.y`;

/** Store a signed-in user the way the portal does (token, user, permissions). */
export function signIn({ role, permissions = [], isInternal, ...rest }) {
  const user = { _id: "u1", id: "u1", fullName: "Test User", email: "u1@example.test", role, permissions, ...rest };
  if (typeof isInternal === "boolean") user.isInternal = isInternal;
  localStorage.setItem("portal_token", token(role));
  localStorage.setItem("portal_user", JSON.stringify(user));
  localStorage.setItem("portal_permissions", JSON.stringify(permissions));
  return user;
}

export function renderPage(ui) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

/** Make every mocked export of an automocked API module resolve to `value`. */
export function fillApi(mod, value) {
  Object.values(mod).forEach((fn) => {
    if (fn && typeof fn.mockResolvedValue === "function") fn.mockResolvedValue(value);
  });
}

export function setupDom() {
  localStorage.clear();
  window.matchMedia = (q) => ({ matches: false, media: q, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {} });
  window.scrollTo = () => {};
}

// Custom roles prove the UI follows permissions, not role names: a custom
// internal role with the permission can act; a built-in role without it can't.
export const CUSTOM_INTERNAL = "content_ops_custom";
export const CUSTOM_EXTERNAL = "partner_viewer_custom";
