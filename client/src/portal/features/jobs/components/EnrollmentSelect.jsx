import React, { useEffect, useState } from "react";
import Button from "../../../shared/ui/Button";
import { Briefcase, CheckCircle2 } from "lucide-react";

export default function EnrollmentSelect({
  value,
  onChange,
  listEnrollments,
  projectId,
  disabled = false,
  allowEmpty = true,
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!projectId) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const res = await listEnrollments(projectId);
      setItems(res?.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || disabled) return;
    load();
    // eslint-disable-next-line
  }, [open, projectId, disabled]);

  return (
    <div className="relative overflow-visible">
      <label className="grid gap-2">
        <span className="text-[11px] font-black tracking-[0.22em] text-slate-500">
          SCOPE ITEM
        </span>

        <button
          type="button"
          disabled={disabled || !projectId}
          onClick={() => !disabled && projectId && setOpen((s) => !s)}
          className={[
            "h-12 w-full rounded-3xl border border-black/10 bg-white px-4 text-left text-sm shadow-sm transition",
            disabled || !projectId
              ? "cursor-not-allowed opacity-60"
              : "hover:bg-black/[0.02]",
          ].join(" ")}
        >
          {value ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-black text-slate-900">
                  {value.serviceTemplateId?.name || "Scope item"}
                </div>
                <div className="truncate text-xs text-slate-500">
                  {String(value.status || "").replaceAll("_", " ")}
                </div>
              </div>
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
          ) : (
            <span className="text-slate-500">
              {projectId
                ? "Optional — select scope item"
                : "Select project first"}
            </span>
          )}
        </button>
      </label>

      {open && !disabled && projectId ? (
        <div className="absolute left-0 right-0 top-full z-[10000] mt-2 overflow-hidden rounded-3xl border border-black/10 bg-white shadow-2xl">
          <div className="border-b border-black/10 p-3">
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-slate-500" />
              <div className="text-sm font-black text-slate-900">
                Select scope item
              </div>
            </div>
          </div>

          <div className="max-h-[280px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-slate-500">Loading…</div>
            ) : (
              <>
                {allowEmpty ? (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(null);
                      setOpen(false);
                    }}
                    className="w-full border-b border-black/5 px-4 py-3 text-left hover:bg-black/[0.03]"
                  >
                    <div className="text-sm font-black text-slate-900">
                      No specific scope item
                    </div>
                    <div className="text-xs text-slate-500">
                      Create a general project-level job
                    </div>
                  </button>
                ) : null}

                {items.length === 0 ? (
                  <div className="p-4 text-sm text-slate-500">
                    No scope items found.
                  </div>
                ) : (
                  items.map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => {
                        onChange(item);
                        setOpen(false);
                      }}
                      className="w-full border-b border-black/5 px-4 py-3 text-left hover:bg-black/[0.03]"
                    >
                      <div className="text-sm font-black text-slate-900">
                        {item.serviceTemplateId?.name || "Scope item"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {String(item.status || "").replaceAll("_", " ")}
                      </div>
                    </button>
                  ))
                )}
              </>
            )}
          </div>

          <div className="flex justify-end bg-slate-50 p-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
