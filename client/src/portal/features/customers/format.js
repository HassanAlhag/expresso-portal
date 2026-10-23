// Display helpers for client accounts (PUI-3). Only fields the API returns.
import { getAssetUrl } from "../../shared/utils/assetUrl";

export const DEPARTMENT_LABEL = {
  digital_agency: "Digital agency",
  procurement: "Procurement",
  both: "Agency and procurement",
};

export const DEPARTMENT_OPTIONS = [
  { value: "digital_agency", label: "Digital agency", hint: "Web, social, content and production" },
  { value: "procurement", label: "Procurement", hint: "Supply, sourcing and purchasing" },
  { value: "both", label: "Both", hint: "Agency and procurement services" },
];

export function departmentOf(c) {
  return c?.department || "digital_agency";
}

export function hasAgency(c) {
  return ["digital_agency", "both"].includes(departmentOf(c));
}

export function hasProcurement(c) {
  return ["procurement", "both"].includes(departmentOf(c));
}

export function clientInitials(name) {
  return (
    String(name || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "?"
  );
}

export function logoSrc(c) {
  return c?.logoUrl ? getAssetUrl(c.logoUrl) : "";
}
