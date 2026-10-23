import React, { useRef, useState } from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import Panel from "../../../shared/ui/Panel";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import TextField from "../../../shared/ui/TextField";
import SelectField from "../../../shared/ui/SelectField";
import RowActions from "../../../shared/ui/RowActions";
import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import { updateStaffSkills } from "../api";

const LEVELS = [
  { value: "beginner", label: "Beginner", tone: "neutral" },
  { value: "intermediate", label: "Intermediate", tone: "info" },
  { value: "advanced", label: "Advanced", tone: "warn" },
  { value: "expert", label: "Expert", tone: "ok" },
];
const level = (v) => LEVELS.find((l) => l.value === v) || { label: v, tone: "neutral" };

// Skills tab of a staff record (PUI-4). Reading needs hr.scorecards.read;
// adding and removing needs hr.scorecards.write (the skills API's permission).
export default function StaffSkillsTab({ staff, onUpdated }) {
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("hr.scorecards.write");
  const skills = Array.isArray(staff.skills) ? staff.skills : [];
  const [name, setName] = useState("");
  const [lvl, setLvl] = useState("beginner");
  const [busy, setBusy] = useState(false);
  const running = useRef(false);

  const save = async (next, done) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      const res = await updateStaffSkills(staff._id, next);
      onUpdated(res.item);
      toast.success(done);
      return true;
    } catch (e) {
      toast.error(e?.response?.data?.message || "Skills weren't saved. Try again.");
      return false;
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  const add = async (e) => {
    e?.preventDefault();
    const n = name.trim();
    if (!n) return;
    if (skills.some((s) => s.name.toLowerCase() === n.toLowerCase())) {
      toast.error(`${n} is already listed. Remove it first to change its level.`);
      return;
    }
    if (await save([...skills, { name: n, level: lvl }], "Skill added.")) {
      setName("");
      setLvl("beginner");
    }
  };

  return (
    <Panel title="Skills" sub={`${skills.length} skill${skills.length === 1 ? "" : "s"}`} flush>
      {skills.length ? (
        <ul className="px-list" aria-label={`Skills of ${staff.fullName}`}>
          {skills.map((s, i) => (
            <li key={`${s.name}-${i}`}>
              <div className="px-t">{s.name}</div>
              <div className="px-r" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Badge tone={level(s.level).tone}>{level(s.level).label}</Badge>
                {canWrite ? (
                  <RowActions
                    label={`skill ${s.name}`}
                    actions={[{ key: "rm", label: "Remove skill", icon: Trash2, tone: "muted", onSelect: () => save(skills.filter((_, j) => j !== i), `${s.name} removed.`) }]}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-inline-empty">
          <Sparkles size={18} aria-hidden="true" />
          <span>No skills recorded yet.</span>
        </div>
      )}
      {canWrite ? (
        <form className="px-toolbar" onSubmit={add} aria-label="Add a skill" style={{ borderTop: "1px solid var(--px-line)" }}>
          <TextField label="Skill" value={name} onChange={(e) => setName(e.target.value)} placeholder="For example Motion design" />
          <SelectField label="Level" value={lvl} onChange={setLvl} options={LEVELS} />
          <Button type="submit" disabled={busy || !name.trim()}>
            <Plus size={14} aria-hidden="true" />
            Add skill
          </Button>
        </form>
      ) : null}
    </Panel>
  );
}
