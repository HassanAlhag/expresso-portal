// Staff record tabs (PUI-4), each shown only with the permission its API
// needs. Overview and learning goals come with the record itself.
export function staffTabsFor(access, staff) {
  return [
    { id: "overview", label: "Overview" },
    access.can("hr.leaves.read") && { id: "leave", label: "Leave" },
    access.can("hr.expenses.read") && { id: "expenses", label: "Expenses" },
    access.can("jobs.read") && { id: "work", label: "Assigned work" },
    access.can("hr.scorecards.read") && { id: "skills", label: "Skills", count: (staff?.skills || []).length },
    { id: "goals", label: "Learning goals", count: (staff?.learningGoals || []).length },
    access.can("hr.scorecards.read") && { id: "reviews", label: "Reviews", count: (staff?.scorecards || []).length },
    access.can("hr.kpi.read") && { id: "kpi", label: "KPI" },
    access.can("activity.read") && { id: "history", label: "Account history" },
  ].filter(Boolean);
}

// What deleting a staff record does (the API hard-deletes it).
export const STAFF_DELETE_DETAILS = [
  "The record is deleted permanently, with its skills, reviews and learning goals.",
  "KPI goals and reporting lines that point to this person are not updated.",
  "To keep the history, set the status to Inactive or Terminated instead.",
];
