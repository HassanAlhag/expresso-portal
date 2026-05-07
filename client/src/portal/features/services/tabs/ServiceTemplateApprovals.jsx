// client/src/portal/features/services/components/ServiceTemplateApprovals.jsx
import React from "react";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import { Plus, Trash2, ListChecks } from "lucide-react";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export default function ServiceTemplateApprovals({ value, onChange }) {
  const v = value || { required: true, steps: [], checklist: [] };

  const set = (patch) => onChange({ ...v, ...patch });

  const addStep = () =>
    set({
      steps: [
        ...(v.steps || []),
        {
          id: uid(),
          name: "Client review",
          role: "client",
          required: true,
          instructions: "",
        },
      ],
    });

  const updateStep = (id, patch) =>
    set({
      steps: (v.steps || []).map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });

  const removeStep = (id) =>
    set({ steps: (v.steps || []).filter((s) => s.id !== id) });

  const addCheck = () =>
    set({
      checklist: [
        ...(v.checklist || []),
        { id: uid(), text: "", required: true },
      ],
    });

  const updateCheck = (id, patch) =>
    set({
      checklist: (v.checklist || []).map((c) =>
        c.id === id ? { ...c, ...patch } : c
      ),
    });

  const removeCheck = (id) =>
    set({ checklist: (v.checklist || []).filter((c) => c.id !== id) });

  return (
    <div className="grid gap-4">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold text-slate-900">
              Approvals
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Defines who approves deliverables before publish/delivery.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={v.required !== false}
                onChange={(e) => set({ required: e.target.checked })}
              />
              Approval required
            </label>
            <Button variant="outline" onClick={addStep}>
              <Plus size={16} />
              Add step
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="text-sm font-extrabold text-slate-900">
          Approval steps
        </div>
        <div className="mt-1 text-sm text-slate-600">Order matters.</div>

        {(v.steps || []).length === 0 ? (
          <div className="mt-3 text-sm text-slate-500">No steps yet.</div>
        ) : (
          <div className="mt-4 grid gap-3">
            {(v.steps || []).map((s, idx) => (
              <div
                key={s.id}
                className="rounded-2xl border border-black/10 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-extrabold tracking-[0.18em] text-slate-500">
                    STEP {idx + 1}
                  </div>
                  <button
                    className="h-9 w-9 rounded-full border border-black/10 hover:bg-black/[0.03]"
                    onClick={() => removeStep(s.id)}
                    title="Remove"
                  >
                    <Trash2 size={16} className="mx-auto" />
                  </button>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Input
                    label="NAME"
                    value={s.name || ""}
                    onChange={(e) => updateStep(s.id, { name: e.target.value })}
                    placeholder="Client review"
                  />
                  <Input
                    label="ROLE"
                    value={s.role || ""}
                    onChange={(e) => updateStep(s.id, { role: e.target.value })}
                    placeholder="client / admin / manager"
                  />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    id={`sr-${s.id}`}
                    type="checkbox"
                    checked={s.required !== false}
                    onChange={(e) =>
                      updateStep(s.id, { required: e.target.checked })
                    }
                  />
                  <label
                    htmlFor={`sr-${s.id}`}
                    className="text-sm font-semibold text-slate-700"
                  >
                    Required step
                  </label>
                </div>

                <label className="mt-3 grid gap-2">
                  <span className="text-xs font-semibold tracking-[0.18em] text-slate-500">
                    INSTRUCTIONS
                  </span>
                  <textarea
                    rows={3}
                    value={s.instructions || ""}
                    onChange={(e) =>
                      updateStep(s.id, { instructions: e.target.value })
                    }
                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-black/5"
                    placeholder="What the approver should check…"
                  />
                </label>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <ListChecks size={16} />
            Approval checklist
          </div>
          <Button variant="outline" onClick={addCheck}>
            <Plus size={16} />
            Add item
          </Button>
        </div>

        {(v.checklist || []).length === 0 ? (
          <div className="mt-3 text-sm text-slate-500">
            Recommended: “Brand guidelines followed”, “Legal text included”,
            “Client approved captions”, etc.
          </div>
        ) : (
          <div className="mt-4 grid gap-2">
            {(v.checklist || []).map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={c.required !== false}
                  onChange={(e) =>
                    updateCheck(c.id, { required: e.target.checked })
                  }
                  title="Required"
                />
                <input
                  value={c.text || ""}
                  onChange={(e) => updateCheck(c.id, { text: e.target.value })}
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder="Checklist item…"
                />
                <button
                  className="h-9 w-9 rounded-full border border-black/10 hover:bg-black/[0.03]"
                  onClick={() => removeCheck(c.id)}
                  title="Remove"
                >
                  <Trash2 size={16} className="mx-auto" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
