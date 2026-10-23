import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Grid3x3, Lock, RefreshCw } from "lucide-react";

import PageFrame from "../../../shared/ui/PageFrame";
import Panel from "../../../shared/ui/Panel";
import Button from "../../../shared/ui/Button";
import SelectField from "../../../shared/ui/SelectField";
import SearchField from "../../../shared/ui/SearchField";
import LoadingState from "../../../shared/ui/LoadingState";
import ErrorState from "../../../shared/ui/ErrorState";
import EmptyState from "../../../shared/ui/EmptyState";
import { useAccess } from "../../../shared/hooks/useAccess";

import { HR_DEPARTMENT_OPTIONS } from "../constants/hr.constants";
import { loadAllStaff } from "../lib/loadAllStaff";

const LEVELS = ["beginner", "intermediate", "advanced", "expert"];
const LEVEL_ABBR = { beginner: "B", intermediate: "I", advanced: "A", expert: "E" };
const LEVEL_LABEL = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced", expert: "Expert" };

// Skill matrix (PUI-4): who has which skill, at what level, from the skills
// on each staff record. Reading staff records needs hr.staff.read.
export default function SkillMatrixPage() {
  const access = useAccess();
  const canStaff = access.can("hr.staff.read");
  const [department, setDepartment] = useState("");
  const [skillQ, setSkillQ] = useState("");
  const [state, setState] = useState({ status: canStaff ? "loading" : "idle", items: [], complete: true });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!canStaff) return undefined;
    let cancelled = false;
    setState((s) => ({ ...s, status: "loading" }));
    loadAllStaff(department ? { department, sort: "fullName" } : { sort: "fullName" })
      .then((r) => !cancelled && setState({ status: "ready", items: r.items, complete: r.complete }))
      .catch(() => !cancelled && setState({ status: "failed", items: [], complete: true }));
    return () => {
      cancelled = true;
    };
  }, [department, canStaff, reload]);

  const withSkills = useMemo(() => state.items.filter((s) => (s.skills || []).length), [state.items]);
  const skills = useMemo(() => {
    const set = new Set();
    withSkills.forEach((s) => s.skills.forEach((k) => k?.name && set.add(k.name)));
    const q = skillQ.trim().toLowerCase();
    return [...set].filter((n) => !q || n.toLowerCase().includes(q)).sort((a, b) => a.localeCompare(b));
  }, [withSkills, skillQ]);
  const rows = useMemo(() => (skillQ.trim() ? withSkills.filter((s) => s.skills.some((k) => skills.includes(k.name))) : withSkills), [withSkills, skills, skillQ]);

  let content;
  if (!canStaff)
    content = <EmptyState icon={Lock} title="The skill matrix needs access to staff records" message="It is built from each staff record's skills. Ask an administrator for HR staff access if you need it." />;
  else if (state.status === "failed") content = <ErrorState title="Staff skills didn't load" onRetry={() => setReload((n) => n + 1)} />;
  else if (state.status === "loading") content = <LoadingState rows={5} label="Loading the skill matrix" />;
  else if (!rows.length)
    content = <EmptyState icon={Grid3x3} title={skillQ.trim() ? "No skills match that search" : "No skills recorded yet"} message="Skills are added on each staff record, in its Skills tab." />;
  else
    content = (
      <div className="px-matrix-scroll" role="region" aria-label="Skill matrix, scrolls sideways" tabIndex={0}>
        <table className="px-matrix">
          <caption className="sr-only">Skill level for each person and skill</caption>
          <thead>
            <tr>
              <th scope="col">Person</th>
              {skills.map((k) => (
                <th scope="col" key={k}>{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const map = Object.fromEntries(s.skills.map((k) => [k.name, k.level]));
              return (
                <tr key={s._id}>
                  <th scope="row">
                    <Link to={`/portal/hr/staff/${s._id}`}>{s.fullName}</Link>
                    {s.jobTitle ? <small>{s.jobTitle}</small> : null}
                  </th>
                  {skills.map((k) => (
                    <td key={k}>
                      {map[k] ? (
                        <span className="px-lvl" data-level={map[k]} title={LEVEL_LABEL[map[k]] || map[k]}>
                          {LEVEL_ABBR[map[k]] || String(map[k])[0]?.toUpperCase()}
                          <span className="sr-only">{`, ${LEVEL_LABEL[map[k]] || map[k]}`}</span>
                        </span>
                      ) : (
                        <span aria-label="None">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );

  return (
    <PageFrame
      title="Skill matrix"
      description="Skills recorded on staff records, by person and level."
      breadcrumb={[{ label: "HR", to: access.canOpen("/portal/hr") ? "/portal/hr" : undefined }, { label: "Skills" }]}
      secondaryActions={
        canStaff ? (
          <Button variant="outline" onClick={() => setReload((n) => n + 1)} disabled={state.status === "loading"}>
            <RefreshCw size={14} className={state.status === "loading" ? "animate-spin" : ""} aria-hidden="true" />
            Refresh
          </Button>
        ) : null
      }
    >
      <Panel flush bare label="Skill matrix" className="px-list-panel">
        {canStaff ? (
          <>
            <div className="px-toolbar" role="search" aria-label="Filter the skill matrix">
              <SearchField label="Find a skill" value={skillQ} onChange={setSkillQ} placeholder="Skill name" />
              <SelectField label="Department" value={department} onChange={setDepartment} options={[{ value: "", label: "Any department" }, ...HR_DEPARTMENT_OPTIONS.filter((o) => o.value)]} />
            </div>
            <div className="px-result-bar">
              <span aria-live="polite">
                {state.status === "ready"
                  ? `${rows.length} ${rows.length === 1 ? "person" : "people"}, ${skills.length} skill${skills.length === 1 ? "" : "s"}${state.complete ? "" : " (first 1,000 staff records only)"}`
                  : ""}
              </span>
              <span className="px-muted">{LEVELS.map((l) => `${LEVEL_ABBR[l]} ${LEVEL_LABEL[l]}`).join(" · ")}</span>
            </div>
          </>
        ) : null}
        {content}
      </Panel>
    </PageFrame>
  );
}
