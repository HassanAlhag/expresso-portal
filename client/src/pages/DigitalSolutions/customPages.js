// Digital Solutions that have a hand-built product page instead of the
// generic CMS block layout. The CMS Solution record selects one with its
// `customPage` field; the key must match CUSTOM_PAGES in the API controller.
import { lazy } from "react";

export const CUSTOM_SOLUTION_PAGES = {
  cas: lazy(() => import("../Products/CASPage")),
};

// Slugs whose custom page is served even before a CMS record exists, so the
// established CAS URL never breaks.
export const CUSTOM_PAGE_BY_SLUG = {
  cas: "cas",
};
