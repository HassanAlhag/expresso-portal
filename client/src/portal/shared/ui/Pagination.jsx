import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

function windowed(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const list = [...set].sort((a, b) => a - b);
  const out = [];
  list.forEach((n, i) => {
    if (i && n - list[i - 1] > 1) out.push(`gap-${n}`);
    out.push(n);
  });
  return out;
}

// Pagination row: "Showing a–b of n" plus previous / numbered / next pages.
export default function Pagination({ page = 1, pages = 1, total = 0, limit = 12, onPage, label = "Pagination", noun = "results", disabled = false }) {
  const from = total ? (page - 1) * limit + 1 : 0;
  const to = Math.min(total, page * limit);
  return (
    <nav className="px-pager" aria-label={label}>
      <span>
        {total ? (
          <>
            Showing <b className="px-num">{from}–{to}</b> of <b className="px-num">{total}</b> {noun}
          </>
        ) : (
          `No ${noun}`
        )}
      </span>
      {pages > 1 ? (
        <ul>
          <li>
            <button type="button" onClick={() => onPage(page - 1)} disabled={disabled || page <= 1} aria-label="Previous page">
              <ChevronLeft size={15} aria-hidden="true" />
            </button>
          </li>
          {windowed(page, pages).map((n) =>
            typeof n === "string" ? (
              <li key={n} className="px-gap" aria-hidden="true">…</li>
            ) : (
              <li key={n}>
                <button
                  type="button"
                  onClick={() => onPage(n)}
                  disabled={disabled}
                  aria-current={n === page ? "page" : undefined}
                  aria-label={`Page ${n}`}
                >
                  {n}
                </button>
              </li>
            )
          )}
          <li>
            <button type="button" onClick={() => onPage(page + 1)} disabled={disabled || page >= pages} aria-label="Next page">
              <ChevronRight size={15} aria-hidden="true" />
            </button>
          </li>
        </ul>
      ) : null}
    </nav>
  );
}
