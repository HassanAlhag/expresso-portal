// Digital Solutions that have a hand-built product page instead of the
// generic CMS block layout. Core slugs resolve locally without a CMS record;
// other records still use the existing generic block renderer.
import { lazy } from "react";

export const CUSTOM_SOLUTION_PAGES = {
  cas: lazy(() => import("../Products/CASPage")),
  "business-suite": lazy(() => import("../Products/BusinessSuitePage")),
};

// Slugs whose custom page is served even before a CMS record exists, so the
// established product URLs never depend on a published CMS record.
export const CUSTOM_PAGE_BY_SLUG = {
  cas: "cas",
  "business-suite": "business-suite",
};
