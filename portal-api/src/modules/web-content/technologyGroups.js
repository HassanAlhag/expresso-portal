// Approved technology taxonomy. The existing Solutions CMS owns membership and
// ordering; these slug defaults keep pre-grouping records usable without writes.
export const TECHNOLOGY_GROUPS = [
  {
    id: "business-software",
    label: "Business Software",
    description: "Systems to connect your teams, customers and day-to-day operations.",
  },
  {
    id: "cloud-hosting",
    label: "Cloud & Hosting",
    description: "Cloud services, hosting and domains to keep your business online.",
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    description: "Data centers, hardware and networks that support your business.",
  },
  {
    id: "connectivity-advisory",
    label: "Connectivity & Advisory",
    description: "Connected technology and expert guidance for your next step.",
  },
];

// Exported for the fallback drift test (P3-7); runtime use is unchanged.
export const LEGACY_GROUPS = {
  "erp-solution": "business-software",
  "crm-solution": "business-software",
  "queue-management": "business-software",
  "software-licensing": "business-software",
  "cloud-services": "cloud-hosting",
  "web-hosting-domains": "cloud-hosting",
  "data-center": "infrastructure",
  "data-center-hardware": "infrastructure",
  "networking-hardware": "infrastructure",
  "iot-solutions": "connectivity-advisory",
  "vas-solutions": "connectivity-advisory",
  "it-consultation": "connectivity-advisory",
};

export const TECHNOLOGY_GROUP_IDS = TECHNOLOGY_GROUPS.map(({ id }) => id);

export function defaultTechnologyGroup(slug) {
  return Object.hasOwn(LEGACY_GROUPS, slug) ? LEGACY_GROUPS[slug] : "";
}

// Effective group for API responses (read-only; never writes).
// Digital Solutions (built by Expresso) have no technology group.
export function withTechnologyGroup(solution) {
  const item = solution.toObject ? solution.toObject() : solution;
  if (item.kind === "digital") return { ...item, group: "" };
  return { ...item, group: item.group || defaultTechnologyGroup(item.slug) };
}
