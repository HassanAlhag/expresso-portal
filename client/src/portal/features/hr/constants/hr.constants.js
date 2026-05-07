export const HR_DEPARTMENT_OPTIONS = [
  { value: "", label: "All departments" },
  { value: "management", label: "Management" },
  { value: "creative", label: "Creative" },
  { value: "marketing", label: "Marketing" },
  { value: "development", label: "Development" },
  { value: "sales", label: "Sales" },
  { value: "finance", label: "Finance" },
  { value: "operations", label: "Operations" },
  { value: "procurement", label: "Procurement" },
  { value: "hr", label: "HR" },
  { value: "other", label: "Other" },
];

export const EXPENSE_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "registered", label: "Registered" },
  { value: "paid", label: "Paid" },
];

export const EXPENSE_CATEGORY_OPTIONS = [
  { value: "", label: "All categories" },
  { value: "transportation", label: "Transportation" },
  { value: "meals", label: "Meals" },
  { value: "office_supplies", label: "Office Supplies" },
  { value: "software_subscription", label: "Software / Subscription" },
  { value: "client_meeting", label: "Client Meeting" },
  { value: "travel", label: "Travel" },
  { value: "accommodation", label: "Accommodation" },
  { value: "communication", label: "Communication" },
  { value: "fuel_parking", label: "Fuel / Parking" },
  { value: "printing", label: "Printing" },
  { value: "equipment", label: "Equipment" },
  { value: "other", label: "Other" },
];

export const EXPENSE_DEPARTMENT_OPTIONS = HR_DEPARTMENT_OPTIONS;

export const EXPENSE_SORT_OPTIONS = [
  { value: "-createdAt", label: "Recent activity" },
  { value: "createdAt", label: "Oldest first" },
  { value: "-expenseDate", label: "Expense date newest" },
  { value: "expenseDate", label: "Expense date oldest" },
  { value: "-amount", label: "Amount high to low" },
  { value: "amount", label: "Amount low to high" },
];

export const STAFF_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On Leave" },
  { value: "probation", label: "Probation" },
  { value: "inactive", label: "Inactive" },
  { value: "terminated", label: "Terminated" },
];

export const STAFF_EMPLOYMENT_TYPE_OPTIONS = [
  { value: "", label: "All employment types" },
  { value: "full_time", label: "Full-Time" },
  { value: "part_time", label: "Part-Time" },
  { value: "contract", label: "Contract" },
  { value: "intern", label: "Intern" },
  { value: "freelance", label: "Freelance" },
];

export const STAFF_SORT_OPTIONS = [
  { value: "-createdAt", label: "Recent activity" },
  { value: "fullName", label: "Name A-Z" },
  { value: "-fullName", label: "Name Z-A" },
  { value: "department", label: "Department A-Z" },
  { value: "-joiningDate", label: "Newest joining" },
  { value: "joiningDate", label: "Oldest joining" },
];

export const LEAVE_TYPE_OPTIONS = [
  { value: "", label: "All leave types" },
  { value: "annual", label: "Annual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "emergency", label: "Emergency Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
  { value: "remote_work", label: "Remote Work" },
  { value: "other", label: "Other" },
];

export const LEAVE_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

export const LEAVE_SORT_OPTIONS = [
  { value: "-createdAt", label: "Recent activity" },
  { value: "createdAt", label: "Oldest first" },
  { value: "startDate", label: "Start date oldest" },
  { value: "-startDate", label: "Start date newest" },
  { value: "staffName", label: "Staff A-Z" },
];
