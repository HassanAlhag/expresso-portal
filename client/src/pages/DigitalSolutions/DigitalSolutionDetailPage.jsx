import React from "react";
import { useParams } from "react-router-dom";
import ITSolutionDetailsPage from "../ITSolutions/ITSolutionDetailsPage";
import { CUSTOM_PAGE_BY_SLUG, CUSTOM_SOLUTION_PAGES } from "./customPages";

// /digital-solutions/:slug — products built and owned by Expresso.
// Core product pages render directly; anything else comes from the
// CMS Solution record (kind "digital").
export default function DigitalSolutionDetailPage() {
  const { slug } = useParams();
  const Custom = CUSTOM_SOLUTION_PAGES[CUSTOM_PAGE_BY_SLUG[slug]];
  if (Custom) return <Custom />;
  return <ITSolutionDetailsPage section="digital" />;
}
