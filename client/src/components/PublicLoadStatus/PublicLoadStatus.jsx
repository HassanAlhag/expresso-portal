import React from "react";
import { Link } from "react-router-dom";

// Shared loading / error / empty states for public pages that read CMS lists.
// Same visual language as Digital Solutions' ProductLoadStatus. Success is
// rendered by the page itself, so this returns nothing for "success".
export default function PublicLoadStatus({
  status,
  loadingText = "Loading…",
  errorTitle = "We couldn’t load this content.",
  errorText = "Please try again, or contact our team if the problem continues.",
  emptyTitle = "Nothing to show yet.",
  emptyText = "Please check back soon, or contact our team.",
  onRetry,
  contactHref = "/contact-us",
  contactLabel = "Contact our team",
}) {
  if (status === "loading") {
    return <p role="status" className="m-0 text-center text-sm text-ink-600">{loadingText}</p>;
  }
  if (status === "error") {
    return (
      <div role="alert" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-200 bg-white p-5 text-left text-sm text-ink-600">
        <div>
          <p className="m-0 font-semibold text-night">{errorTitle}</p>
          <p className="mb-0 mt-1">{errorText}</p>
        </div>
        {onRetry ? (
          <button type="button" onClick={onRetry} className="rounded-full bg-lotus-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-lotus-700">
            Try again
          </button>
        ) : null}
      </div>
    );
  }
  if (status === "empty") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-200 bg-white p-5 text-left text-sm text-ink-600">
        <div>
          <p className="m-0 font-semibold text-night">{emptyTitle}</p>
          <p className="mb-0 mt-1">{emptyText}</p>
        </div>
        <Link to={contactHref} className="text-sm font-semibold text-lotus-700 underline underline-offset-4">
          {contactLabel}
        </Link>
      </div>
    );
  }
  return null;
}
