import React, { useEffect, useMemo, useState } from "react";
import { Grid3x3 } from "lucide-react";

import Card from "../../../shared/ui/Card";
import Badge from "../../../shared/ui/Badge";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import { useToast } from "../../../shared/ui/Toast";

import { listStaff } from "../api";

const LEVELS = ["beginner", "intermediate", "advanced", "expert"];

const LEVEL_TONE = {
  beginner: "neutral",
  intermediate: "info",
  advanced: "warning",
  expert: "success",
};

const LEVEL_ABBR = {
  beginner: "B",
  intermediate: "I",
  advanced: "A",
  expert: "E",
};

const DEPT_OPTIONS = [
  { value: "", label: "All Departments" },
  { value: "engineering", label: "Engineering" },
  { value: "design", label: "Design" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "hr", label: "HR" },
  { value: "finance", label: "Finance" },
  { value: "operations", label: "Operations" },
  { value: "other", label: "Other" },
];

export default function SkillMatrixPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff]     = useState([]);
  const [dept, setDept]       = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = { limit: 100 };
        if (dept) params.department = dept;
        const res = await listStaff(params);
        if (!cancelled) setStaff(res?.items || []);
      } catch (e) {
        if (!cancelled) toast.error(e?.response?.data?.message || e?.message || "Failed to load staff.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dept]);

  const allSkills = useMemo(() => {
    const set = new Set();
    staff.forEach((s) => (s.skills || []).forEach((sk) => set.add(sk.name)));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [staff]);

  const staffWithSkills = useMemo(
    () => staff.filter((s) => (s.skills || []).length > 0),
    [staff]
  );

  return (
    <div className="grid gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-slate-900">Skill Matrix</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {staffWithSkills.length} staff · {allSkills.length} unique skill{allSkills.length !== 1 ? "s" : ""}
          </p>
        </div>
        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
        >
          {DEPT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
        </div>
      ) : staffWithSkills.length === 0 ? (
        <EmptyState icon={Grid3x3} title="No skills data" message="Add skills to staff profiles to see the matrix." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="sticky left-0 z-10 bg-white px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400 min-w-[160px]">
                    Staff
                  </th>
                  {allSkills.map((skill) => (
                    <th key={skill} className="px-3 py-3 text-center text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-400 whitespace-nowrap min-w-[90px]">
                      {skill}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {staffWithSkills.map((s) => {
                  const skillMap = {};
                  (s.skills || []).forEach((sk) => { skillMap[sk.name] = sk.level; });
                  return (
                    <tr key={s._id} className="hover:bg-slate-50">
                      <td className="sticky left-0 z-10 bg-white px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50">
                        <div className="truncate max-w-[150px]">{s.fullName}</div>
                        {s.jobTitle && <div className="truncate text-[11px] text-slate-400">{s.jobTitle}</div>}
                      </td>
                      {allSkills.map((skill) => {
                        const level = skillMap[skill];
                        return (
                          <td key={skill} className="px-3 py-3 text-center">
                            {level ? (
                              <span title={level}>
                                <Badge tone={LEVEL_TONE[level] || "neutral"} className="text-[11px]">
                                  {LEVEL_ABBR[level] || level[0].toUpperCase()}
                                </Badge>
                              </span>
                            ) : (
                              <span className="text-slate-200">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-4 py-3">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Level:</span>
            {LEVELS.map((l) => (
              <span key={l} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Badge tone={LEVEL_TONE[l]}>{LEVEL_ABBR[l]}</Badge>
                {l}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
