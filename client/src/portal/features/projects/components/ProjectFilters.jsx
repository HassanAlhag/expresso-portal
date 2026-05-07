import React from "react";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import { ChevronDown } from "lucide-react";
import {
  PROJECT_PRIORITY_OPTIONS,
  PROJECT_SORT_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  PROJECT_TYPE_OPTIONS,
} from "../constants";

const PROJECT_MODE_OPTIONS = [
  { value: "", label: "All modes" },
  { value: "pre_contract", label: "Pre-contract" },
  { value: "contracted", label: "Contracted" },
  { value: "custom", label: "Custom" },
  { value: "internal", label: "Internal" },
];

const PROJECT_SOURCE_OPTIONS = [
  { value: "", label: "All sources" },
  { value: "manual", label: "Manual" },
  { value: "sales", label: "Sales" },
  { value: "enrollment", label: "Enrollment" },
  { value: "internal", label: "Internal" },
];

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="grid gap-2">
      <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
        {label}
      </span>

      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className="h-11 w-full appearance-none rounded-2xl border border-black/10 bg-white px-4 pr-10 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-black/5"
        >
          {options.map((o) => (
            <option key={`${o.value}-${o.label}`} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          <ChevronDown size={18} />
        </span>
      </div>
    </label>
  );
}

export default function ProjectFilters({
  q,
  status,
  type,
  priority,
  projectMode,
  source,
  sort,
  page,
  pages,
  busy,
  onChangeQ,
  onChangeStatus,
  onChangeType,
  onChangePriority,
  onChangeProjectMode,
  onChangeSource,
  onChangeSort,
  onClear,
}) {
  return (
    <Card className="p-4">
      <div className="grid items-end gap-3 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <Input
            label="Search"
            value={q}
            onChange={(e) => onChangeQ?.(e.target.value)}
            placeholder="name, code, notes…"
          />
        </div>

        <div className="lg:col-span-2">
          <SelectField
            label="STATUS"
            value={status}
            onChange={(e) => onChangeStatus?.(e.target.value)}
            options={PROJECT_STATUS_OPTIONS}
          />
        </div>

        <div className="lg:col-span-2">
          <SelectField
            label="TYPE"
            value={type}
            onChange={(e) => onChangeType?.(e.target.value)}
            options={PROJECT_TYPE_OPTIONS}
          />
        </div>

        <div className="lg:col-span-2">
          <SelectField
            label="PRIORITY"
            value={priority}
            onChange={(e) => onChangePriority?.(e.target.value)}
            options={PROJECT_PRIORITY_OPTIONS}
          />
        </div>

        <div className="lg:col-span-3">
          <SelectField
            label="PROJECT MODE"
            value={projectMode}
            onChange={(e) => onChangeProjectMode?.(e.target.value)}
            options={PROJECT_MODE_OPTIONS}
          />
        </div>

        <div className="lg:col-span-2">
          <SelectField
            label="SOURCE"
            value={source}
            onChange={(e) => onChangeSource?.(e.target.value)}
            options={PROJECT_SOURCE_OPTIONS}
          />
        </div>

        <div className="lg:col-span-2">
          <SelectField
            label="SORT"
            value={sort}
            onChange={(e) => onChangeSort?.(e.target.value)}
            options={PROJECT_SORT_OPTIONS}
          />
        </div>

        <div className="lg:col-span-8 flex items-center gap-2 pt-1">
          <Button variant="outline" onClick={onClear} disabled={busy}>
            Clear
          </Button>

          <div className="ml-auto text-xs font-semibold text-slate-500">
            Page <span className="font-extrabold">{page}</span> /{" "}
            <span className="font-extrabold">{pages}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
