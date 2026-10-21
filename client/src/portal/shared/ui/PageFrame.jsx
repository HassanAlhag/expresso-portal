import React from "react";
import PageHeader from "./PageHeader";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";
import EmptyState from "./EmptyState";

// Standard page frame: header (breadcrumbs → top bar, title, description,
// primary and secondary actions), an optional filters/search row, and the
// content region with built-in loading, error and empty states.
export default function PageFrame({
  title,
  description,
  breadcrumb,
  meta,
  primaryAction,
  secondaryActions,
  filters,
  loading = false,
  error = null,
  onRetry,
  empty = null, // { icon, title, message, action }
  isEmpty = false,
  children,
}) {
  const actions =
    primaryAction || secondaryActions ? (
      <>
        {secondaryActions}
        {primaryAction}
      </>
    ) : null;

  let content = children;
  if (loading) content = <LoadingState />;
  else if (error) content = <ErrorState message={typeof error === "string" ? error : undefined} onRetry={onRetry} />;
  else if (isEmpty && empty) content = <EmptyState {...empty} />;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <PageHeader title={title} description={description} breadcrumb={breadcrumb} meta={meta} actions={actions} />
      {filters ? <div className="px-filters">{filters}</div> : null}
      {content}
    </div>
  );
}
