import React from "react";

export default function ProductLoadStatus({ loading, error, retry }) {
  if (loading) return <p role="status" aria-label="Loading products" className="m-0 text-sm text-ink-600">Loading the latest product information…</p>;
  if (!error) return null;
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-200 bg-white p-5 text-sm text-ink-600">
      <div><p className="m-0 font-semibold text-night">We couldn’t load the latest product information.</p><p className="mb-0 mt-1">You can still explore our products. Please try again or contact our team for help.</p></div>
      <button type="button" onClick={retry} className="rounded-full bg-lotus-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-lotus-700">Try again</button>
    </div>
  );
}
