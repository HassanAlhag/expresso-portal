import React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

// Sort state uses the API convention: "field" ascending, "-field" descending.
export function parseSort(sort = "") {
  const s = String(sort || "");
  return s.startsWith("-") ? { field: s.slice(1), dir: "desc" } : { field: s, dir: s ? "asc" : "" };
}

export function nextSort(current, field, firstDir = "asc") {
  const { field: f, dir } = parseSort(current);
  if (f !== field) return firstDir === "desc" ? `-${field}` : field;
  return dir === "asc" ? `-${field}` : field;
}

// Column header that sorts. aria-sort on the <th> tells assistive technology
// which column is sorted and in which direction.
export default function SortHeader({ label, field, sort, onSort, firstDir = "asc", className = "", align }) {
  const { field: f, dir } = parseSort(sort);
  const active = f === field;
  const state = active ? (dir === "desc" ? "descending" : "ascending") : undefined;
  const Icon = !active ? ArrowUpDown : dir === "desc" ? ArrowDown : ArrowUp;
  return (
    <th scope="col" aria-sort={state || "none"} className={[align === "right" ? "px-num" : "", className].filter(Boolean).join(" ")}>
      <button type="button" className="px-sort" onClick={() => onSort(nextSort(sort, field, firstDir))}>
        {label}
        <Icon size={13} aria-hidden="true" style={{ opacity: active ? 1 : 0.45 }} />
        <span className="sr-only">{active ? `, sorted ${state}` : ", sortable"}</span>
      </button>
    </th>
  );
}
