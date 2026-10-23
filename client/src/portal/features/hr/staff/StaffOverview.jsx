import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Panel from "../../../shared/ui/Panel";
import KeyValue from "../../../shared/ui/KeyValue";
import { useAccess } from "../../../shared/hooks/useAccess";
import { getStaffBenchmark } from "../api";
import { date, employmentTypeLabel, humanize, idOf, money } from "../format";

const amount = (v) => Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 1 });

// Overview tab of a staff record (PUI-4): the record's own fields, and the
// department comparison the API works out from approved leave and expenses.
export default function StaffOverview({ staff }) {
  const access = useAccess();
  const [bench, setBench] = useState({ state: "loading", data: null });

  useEffect(() => {
    let cancelled = false;
    setBench({ state: "loading", data: null });
    getStaffBenchmark(staff._id)
      .then((r) => !cancelled && setBench({ state: r?.ok ? "ready" : "failed", data: r?.ok ? r : null }))
      .catch(() => !cancelled && setBench({ state: "failed", data: null }));
    return () => {
      cancelled = true;
    };
  }, [staff._id]);

  const manager = staff.managerStaffId && typeof staff.managerStaffId === "object" ? staff.managerStaffId : null;
  const user = staff.linkedUserId && typeof staff.linkedUserId === "object" ? staff.linkedUserId : null;
  const b = bench.data;

  return (
    <div className="px-grid px-cols-detail">
      <div className="px-stack">
        <Panel title="Employment">
          <KeyValue
            items={[
              { label: "Job title", value: staff.jobTitle },
              { label: "Department", value: humanize(staff.department, "") },
              { label: "Employment", value: employmentTypeLabel(staff.employmentType) },
              { label: "Joined", value: date(staff.joiningDate) },
              { label: "Team", value: staff.teamId?.label },
              {
                label: "Reports to",
                value: manager ? <Link to={`/portal/hr/staff/${idOf(manager)}`}>{manager.fullName}</Link> : null,
              },
            ]}
          />
        </Panel>
        <Panel title="Contact">
          <KeyValue
            items={[
              { label: "Email", value: staff.email },
              { label: "Phone", value: staff.phone },
              { label: "Location", value: [staff.city, staff.country].filter(Boolean).join(", "), hidden: !staff.city && !staff.country },
              { label: "Address", value: staff.address, hidden: !staff.address },
              { label: "Emergency contact", value: [staff.emergencyContactName, staff.emergencyContactPhone].filter(Boolean).join(", ") },
            ]}
          />
        </Panel>
        {staff.notes ? (
          <Panel title="Notes">
            <p className="px-prose">{staff.notes}</p>
          </Panel>
        ) : null}
      </div>
      <div className="px-stack">
        <Panel title="Pay" sub="Visible to people with HR staff access">
          <KeyValue className="px-kv--side" items={[{ label: "Monthly salary", value: staff.monthlySalary === null || staff.monthlySalary === undefined ? "" : money(staff.monthlySalary, staff.currency) }]} />
        </Panel>
        <Panel title="Portal account">
          <KeyValue
            className="px-kv--side"
            items={[
              { label: "Linked user", value: user ? user.fullName || user.email : "Not linked" },
              { label: "Email", value: user?.email, hidden: !user?.email },
              { label: "Role", value: humanize(user?.role, ""), hidden: !user?.role || !access.isInternal },
            ]}
          />
        </Panel>
        <Panel title="Compared with the department" sub={b ? `${humanize(b.department)}, ${b.staffCount} staff records` : undefined}>
          {bench.state === "loading" ? (
            <p className="px-muted" style={{ margin: 0 }}>Loading…</p>
          ) : bench.state === "failed" ? (
            <p className="px-muted" style={{ margin: 0 }}>The comparison didn't load.</p>
          ) : (
            <>
              <KeyValue
                className="px-kv--side"
                items={[
                  { label: "Approved leave days", value: `${amount(b.mine.leaveDays)} (average ${amount(b.avg.leaveDays)})` },
                  { label: "Approved expenses", value: `${amount(b.mine.expenseAmount)} (average ${amount(b.avg.expenseAmount)})` },
                ]}
              />
              <p className="px-muted" style={{ margin: "8px 0 0", fontSize: 12 }}>All time, matched by staff name. Expense amounts are added as recorded, without currency conversion.</p>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
