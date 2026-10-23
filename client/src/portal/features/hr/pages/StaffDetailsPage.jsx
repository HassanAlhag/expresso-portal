import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Building2, CalendarDays, Mail, Pencil, RefreshCw, Trash2 } from "lucide-react";

import { useToast } from "../../../shared/ui/Toast";
import { useAccess } from "../../../shared/hooks/useAccess";
import { usePageCrumbs } from "../../../layouts/ShellContext";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import RowActions from "../../../shared/ui/RowActions";
import LoadingState from "../../../shared/ui/LoadingState";
import ErrorState from "../../../shared/ui/ErrorState";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import TabBar, { TabPanel } from "../../../shared/ui/TabBar";

import { deleteStaff, getStaff, updateStaff } from "../api";
import { STAFF_STATUS_TONE, date, humanize, staffStatusLabel } from "../format";
import StaffFormModal from "../components/StaffFormModal";
import { STAFF_DELETE_DETAILS, staffTabsFor } from "../staff/staffTabs";
import StaffOverview from "../staff/StaffOverview";
import { StaffExpensesTab, StaffLeaveTab } from "../staff/StaffHrRecords";
import StaffWorkTab from "../staff/StaffWorkTab";
import StaffSkillsTab from "../staff/StaffSkillsTab";
import StaffLearningGoalsTab from "../staff/StaffLearningGoalsTab";
import StaffScorecardTab from "../staff/StaffScorecardTab";
import StaffKpiTab from "../staff/StaffKpiTab";
import StaffAccountHistory from "../staff/StaffAccountHistory";

// Staff record (PUI-4, hr.staff.read). Tabs and actions follow the user's
// effective permissions; see staffTabsFor.
export default function StaffDetailsPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const access = useAccess();
  const canWrite = access.can("hr.staff.write");
  const canDelete = access.can("hr.staff.delete");

  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [tab, setTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [removing, setRemoving] = useState(false);

  usePageCrumbs(staff ? [{ label: "Staff", to: "/portal/hr/staff" }, { label: staff.fullName || "Staff record" }] : []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getStaff(id);
      setStaff(res?.item || null);
      if (!res?.item) setLoadError({ status: 404 });
    } catch (e) {
      setLoadError({ status: e?.response?.status, message: e?.response?.data?.message });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const tabs = useMemo(() => (staff ? staffTabsFor(access, staff) : []), [access, staff]);
  const activeTab = tabs.some((t) => t.id === tab) ? tab : "overview";

  if (loading && !staff) return <LoadingState rows={6} label="Loading staff record" />;
  if (loadError || !staff) {
    const s = loadError?.status;
    return (
      <ErrorState
        title={s === 404 ? "Staff record not found" : s === 403 ? "You don't have access to staff records" : "This staff record didn't load"}
        message={s === 404 ? "It may have been deleted, or the link is wrong." : s === 403 ? "Ask an administrator if you need it." : loadError?.message || undefined}
        onRetry={s === 404 || s === 403 ? undefined : load}
      />
    );
  }

  // Sub-resource APIs return the whole updated record.
  const onUpdated = (item) => item && setStaff(item);

  const save = async (payload) => {
    setBusy(true);
    setFormError("");
    try {
      await updateStaff(staff._id, payload);
      toast.success("Staff record updated.");
      setEditOpen(false);
      await load();
    } catch (e) {
      setFormError(e?.response?.data?.message || "That didn't save. Check the details and try again.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    try {
      await deleteStaff(staff._id);
      toast.success("Staff record deleted.");
      setRemoving(false);
      nav("/portal/hr/staff");
    } catch (e) {
      toast.error(e?.response?.data?.message || "The record wasn't deleted. Try again.");
    }
  };

  const menu = [
    { key: "refresh", label: "Refresh", icon: RefreshCw, onSelect: () => load() },
    canDelete ? { key: "sep", separator: true } : null,
    canDelete ? { key: "delete", label: "Delete record", icon: Trash2, tone: "muted", onSelect: () => setRemoving(true) } : null,
  ];

  return (
    <>
      <div className="px-stack" style={{ gap: 20 }}>
        <header className="px-record-head">
          <div className="px-record-id">
            <div className="px-record-tags">
              <Badge tone={STAFF_STATUS_TONE[staff.status] || "neutral"} dot>{staffStatusLabel(staff.status)}</Badge>
              {staff.department ? <span className="px-code">{humanize(staff.department)}</span> : null}
            </div>
            <h1>{staff.fullName}</h1>
            <ul className="px-record-meta" aria-label="Staff summary">
              {staff.jobTitle ? (
                <li>
                  <Building2 size={15} aria-hidden="true" />
                  {staff.jobTitle}
                </li>
              ) : null}
              {staff.email ? (
                <li>
                  <Mail size={15} aria-hidden="true" />
                  <a href={`mailto:${staff.email}`}>{staff.email}</a>
                </li>
              ) : null}
              {staff.joiningDate ? (
                <li>
                  <CalendarDays size={15} aria-hidden="true" />
                  Joined {date(staff.joiningDate)}
                </li>
              ) : null}
            </ul>
          </div>
          <div className="px-record-actions">
            {canWrite ? (
              <Button variant="outline" onClick={() => { setFormError(""); setEditOpen(true); }}>
                <Pencil size={15} aria-hidden="true" />
                Edit
              </Button>
            ) : null}
            <RowActions label={staff.fullName} actions={menu} />
          </div>
        </header>

        <TabBar idPrefix="staff" label="Staff record sections" value={activeTab} onChange={setTab} tabs={tabs} />
        <TabPanel idPrefix="staff" id={activeTab} className="px-tabpanel--spaced">
          {activeTab === "overview" ? <StaffOverview staff={staff} /> : null}
          {activeTab === "leave" ? <StaffLeaveTab staff={staff} /> : null}
          {activeTab === "expenses" ? <StaffExpensesTab staff={staff} /> : null}
          {activeTab === "work" ? <StaffWorkTab staff={staff} /> : null}
          {activeTab === "skills" ? <StaffSkillsTab staff={staff} onUpdated={onUpdated} /> : null}
          {activeTab === "goals" ? <StaffLearningGoalsTab staff={staff} onUpdated={onUpdated} /> : null}
          {activeTab === "reviews" ? <StaffScorecardTab staff={staff} onUpdated={onUpdated} /> : null}
          {activeTab === "kpi" ? <StaffKpiTab staff={staff} /> : null}
          {activeTab === "history" ? <StaffAccountHistory staff={staff} /> : null}
        </TabPanel>
      </div>

      {canWrite ? <StaffFormModal open={editOpen} initial={staff} busy={busy} error={formError} onClose={() => setEditOpen(false)} onSubmit={save} /> : null}
      <ConfirmDialog
        open={removing}
        icon={Trash2}
        tone="bad"
        danger
        title="Delete this staff record?"
        confirmLabel="Delete record"
        details={STAFF_DELETE_DETAILS}
        onClose={() => setRemoving(false)}
        onConfirm={remove}
      >
        {`${staff.fullName}${staff.jobTitle ? `, ${staff.jobTitle}` : ""}.`}
      </ConfirmDialog>
    </>
  );
}
