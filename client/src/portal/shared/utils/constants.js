// src/portal/utils/constants.js

export const BRAND = "#7F8AD1";

export const AUTH_KEY = "expresso_portal_demo_auth";
export const ONBOARDED_KEY = "expresso_portal_onboarded_v1";
export const PORTAL_DB_KEY = "expresso_portal_db_v1";

export const DEFAULT_PORTAL_DB = {
  profile: {
    company: localStorage.getItem("portal_client") || "",
    email: localStorage.getItem("portal_email") || "",
    planId: "",
    industry: "Real Estate",
    updatedAt: "",
  },
  projects: [],
  tickets: [],
  files: [],
  billing: { invoices: [] },
};
