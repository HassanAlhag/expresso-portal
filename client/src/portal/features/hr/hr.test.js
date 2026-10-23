// PUI-4 — HR / People in the production design system: leave, expense
// claims, the HR overview, staff records and KPI. Effective permissions only;
// approvers never decide on their own records (super_admin excepted).
/* eslint-disable testing-library/no-node-access, testing-library/no-unnecessary-act */
import React from "react";
import { render, screen, fireEvent, within, act } from "@testing-library/react";

const mockNavigate = jest.fn();
let mockParams = { id: "e1" };
jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");
    return {
      useNavigate: () => mockNavigate,
      useParams: () => mockParams,
      useLocation: () => ({ pathname: "/portal/hr" }),
      Link: ({ to, children, ...rest }) => React.createElement("a", { href: to, ...rest }, children),
    };
  },
  { virtual: true }
);
const API = ["listExpenses", "getExpense", "createExpense", "updateExpense", "deleteExpense", "approveExpense", "rejectExpense", "registerExpense", "markExpensePaid", "getExpenseStats", "getMonthlyExpenses", "getMonthlyExpenseDetails", "listStaff", "getStaffStats", "getStaff", "createStaff", "updateStaff", "deleteStaff", "updateStaffSkills", "addStaffScorecard", "removeStaffScorecard", "addStaffLearningGoal", "updateStaffLearningGoal", "removeStaffLearningGoal", "listLeaves", "getLeaveStats", "createLeave", "updateLeave", "deleteLeave", "approveLeave", "rejectLeave", "cancelLeave", "getStaffBenchmark", "listScorecardTemplates", "createScorecardTemplate", "updateScorecardTemplate", "deleteScorecardTemplate", "listKPIIndicators", "createKPIIndicator", "updateKPIIndicator", "deleteKPIIndicator", "listKPIGoals", "getKPIGoal", "createKPIGoal", "updateKPIGoal", "deleteKPIGoal", "syncKPIGoal", "listKPICheckins", "createKPICheckin", "deleteKPICheckin", "getKPIDashboard"];
jest.mock("./api", () => Object.fromEntries(["listExpenses", "getExpense", "createExpense", "updateExpense", "deleteExpense", "approveExpense", "rejectExpense", "registerExpense", "markExpensePaid", "getExpenseStats", "getMonthlyExpenses", "getMonthlyExpenseDetails", "listStaff", "getStaffStats", "getStaff", "createStaff", "updateStaff", "deleteStaff", "updateStaffSkills", "addStaffScorecard", "removeStaffScorecard", "addStaffLearningGoal", "updateStaffLearningGoal", "removeStaffLearningGoal", "listLeaves", "getLeaveStats", "createLeave", "updateLeave", "deleteLeave", "approveLeave", "rejectLeave", "cancelLeave", "getStaffBenchmark", "listScorecardTemplates", "createScorecardTemplate", "updateScorecardTemplate", "deleteScorecardTemplate", "listKPIIndicators", "createKPIIndicator", "updateKPIIndicator", "deleteKPIIndicator", "listKPIGoals", "getKPIGoal", "createKPIGoal", "updateKPIGoal", "deleteKPIGoal", "syncKPIGoal", "listKPICheckins", "createKPICheckin", "deleteKPICheckin", "getKPIDashboard"].map((k) => [k, jest.fn()])));
jest.mock("../iam/teams/api", () => ({ listTeams: jest.fn(() => Promise.resolve({ items: [] })) }));
jest.mock("../iam/users/api", () => ({ listUsers: jest.fn(() => Promise.resolve({ users: [] })) }));
jest.mock("../jobs/api", () => ({ listJobs: jest.fn(() => Promise.resolve({ items: [], total: 0 })) }));
jest.mock("../../shared/api/client", () => ({ api: { get: jest.fn(() => Promise.resolve({ data: { items: [], total: 0 } })) } }));
const mockToast = { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() };
jest.mock("../../shared/ui/Toast", () => ({ useToast: () => mockToast }));

const api = require("./api");
const LeaveRequestsPage = require("./pages/LeaveRequestsPage").default;
const ExpenseClaimsPage = require("./pages/ExpenseClaimsPage").default;
const ExpenseClaimDetailsPage = require("./pages/ExpenseClaimDetailsPage").default;
const MonthlyExpensesPage = require("./pages/MonthlyExpensesPage").default;
const StaffPage = require("./pages/StaffPage").default;
const StaffFormModal = require("./components/StaffFormModal").default;
const ExpenseClaimFormModal = require("./components/ExpenseClaimFormModal").default;
const { loadHrOverview, deriveHrOverview } = require("./lib/hrOverview");
const { staffTabsFor } = require("./staff/staffTabs");
const { belongsToStaff } = require("./staff/staffRecords");
const { makeAccess } = require("../../shared/hooks/useAccess");
const KpiGoalTable = require("./kpi/KpiGoalTable").default;
const KPIIndicatorsPage = require("./pages/KPIIndicatorsPage").default;
const StaffDetailsPage = require("./pages/StaffDetailsPage").default;

function signIn(role, permissions, { id = "me", isInternal = true } = {}) {
  const user = { _id: id, fullName: "Sara Khan", role, permissions, isInternal };
  localStorage.setItem("portal_user", JSON.stringify(user));
  localStorage.setItem("portal_permissions", JSON.stringify(permissions));
  return makeAccess(user);
}

const HR_MANAGER = ["hr.staff.read", "hr.staff.write", "hr.expenses.read", "hr.expenses.write", "hr.expenses.approve", "hr.leaves.read", "hr.leaves.write", "hr.leaves.approve", "hr.scorecards.read", "hr.scorecards.write", "hr.kpi.read", "hr.kpi.write"];
const STAFF = ["hr.expenses.read", "hr.expenses.write", "hr.leaves.read", "hr.leaves.write", "hr.scorecards.read", "hr.kpi.read"];
const listOf = (items, total = items.length) => ({ ok: true, items, total, page: 1, pages: 1, limit: 12 });
const leave = (over = {}) => ({ _id: "l1", staffName: "Ali Hassan", staffUserId: "u2", department: "creative", leaveType: "annual", startDate: "2026-11-02", endDate: "2026-11-04", days: 3, status: "submitted", ...over });
const claim = (over = {}) => ({ _id: "e1", title: "Taxi to client", staffName: "Ali Hassan", staffUserId: { _id: "u2", fullName: "Ali Hassan" }, department: "creative", category: "transportation", amount: 85, currency: "AED", expenseDate: "2026-10-02", claimMonth: "2026-10", status: "submitted", paymentStatus: "unpaid", createdAt: "2026-10-02T09:00:00Z", ...over });

async function interact(fn) {
  await act(async () => {
    fn();
  });
  await act(() => new Promise((r) => setTimeout(r, 350)));
}
const menuItems = () => within(screen.getByRole("menu")).getAllByRole("menuitem").map((i) => i.textContent);

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockParams = { id: "e1" };
  api.listLeaves.mockResolvedValue(listOf([leave(), leave({ _id: "l2", staffName: "Sara Khan", staffUserId: "me" })]));
  api.getLeaveStats.mockResolvedValue({ ok: true, totals: { total: 9, submitted: 2, approved: 5, rejected: 1, cancelled: 1, upcoming: 3 } });
  api.listExpenses.mockResolvedValue(listOf([claim(), claim({ _id: "e2", title: "Own lunch", staffName: "Sara Khan", staffUserId: "me" }), claim({ _id: "e3", title: "Printer ink", status: "approved" }), claim({ _id: "e4", title: "Hotel", status: "registered", registeredMonth: "2026-09" })]));
  api.getExpenseStats.mockResolvedValue({ ok: true, totals: { total: 12, pending: 2, approved: 1, registered: 1, rejected: 3, paid: 5 } });
  api.listKPIIndicators.mockResolvedValue({ items: [] });
  api.listKPIGoals.mockResolvedValue({ items: [] });
  api.getStaffBenchmark.mockResolvedValue({ ok: false });
  api.listScorecardTemplates.mockResolvedValue({ items: [] });
});

describe("Leave", () => {
  async function renderLeave() {
    await act(async () => {
      render(<LeaveRequestsPage />);
    });
  }

  test("an approver decides on others' requests but not on their own", async () => {
    signIn("hr_management", HR_MANAGER);
    await renderLeave();
    await interact(() => fireEvent.click(screen.getByRole("button", { name: "More actions for Ali Hassan leave" })));
    expect(menuItems()).toEqual(expect.arrayContaining(["Approve", "Reject"]));
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    await interact(() => fireEvent.click(screen.getByRole("button", { name: "More actions for Sara Khan leave" })));
    expect(menuItems()).not.toContain("Approve");
    expect(menuItems()).not.toContain("Reject");
  });

  test("self-service staff see their own requests with no approval actions", async () => {
    signIn("staff", STAFF);
    await renderLeave();
    expect(screen.getByText("Your leave requests and their status.")).toBeTruthy();
    // Someone else's submitted request: nothing this user may do, so no menu at all.
    expect(screen.queryByRole("button", { name: "More actions for Ali Hassan leave" })).toBe(null);
    await interact(() => fireEvent.click(screen.getByRole("button", { name: "More actions for Sara Khan leave" })));
    expect(menuItems()).toEqual(["Edit request", "Cancel request"]);
  });

  test("rejecting sends the reason once, even on a double submit", async () => {
    signIn("hr_management", HR_MANAGER);
    let release;
    api.rejectLeave.mockImplementation(() => new Promise((r) => (release = () => r({ ok: true }))));
    await renderLeave();
    await interact(() => fireEvent.click(screen.getByRole("button", { name: "More actions for Ali Hassan leave" })));
    await interact(() => fireEvent.click(within(screen.getByRole("menu")).getByText("Reject")));
    const dialog = screen.getByRole("dialog", { name: "Reject this leave request?" });
    fireEvent.change(within(dialog).getByLabelText("Why it's being rejected"), { target: { value: "Busy week" } });
    const submit = within(dialog).getByRole("button", { name: /Reject request/ });
    await act(async () => {
      fireEvent.click(submit);
      fireEvent.click(submit);
    });
    await act(async () => release());
    expect(api.rejectLeave).toHaveBeenCalledTimes(1);
    expect(api.rejectLeave).toHaveBeenCalledWith("l1", "Busy week");
  });

  test("a failed stats request is not shown as zero", async () => {
    signIn("staff", STAFF);
    api.getLeaveStats.mockRejectedValue(new Error("down"));
    await renderLeave();
    expect(screen.queryByRole("region", { name: "Leave summary" })).toBe(null);
  });
});

describe("Expense claims", () => {
  async function renderClaims() {
    await act(async () => {
      render(<ExpenseClaimsPage />);
    });
  }

  test("counts come from the stats endpoint, with no cross-currency sums", async () => {
    signIn("finance", ["hr.expenses.read", "hr.expenses.write", "hr.expenses.approve"]);
    await renderClaims();
    const summary = screen.getByRole("region", { name: "Expense claim summary" });
    expect(within(summary).getByText("12 claims in all, 3 rejected")).toBeTruthy();
    expect(summary.textContent).not.toMatch(/AED/);
  });

  test("approvers get the workflow step each claim is at; never on their own claim", async () => {
    signIn("finance", ["hr.expenses.read", "hr.expenses.write", "hr.expenses.approve"]);
    await renderClaims();
    const open = async (name) => {
      await interact(() => fireEvent.click(screen.getByRole("button", { name: `More actions for ${name}` })));
      const items = menuItems();
      fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
      return items;
    };
    expect(await open("Taxi to client")).toEqual(expect.arrayContaining(["Approve", "Reject"]));
    const own = await open("Own lunch");
    expect(own).not.toContain("Approve");
    expect(await open("Printer ink")).toContain("Register to a month");
    const registered = await open("Hotel");
    expect(registered).toContain("Mark as paid");
    expect(registered).not.toContain("Edit claim");
    expect(registered).not.toContain("Delete claim");
  });

  test("registering sends the chosen month", async () => {
    signIn("finance", ["hr.expenses.read", "hr.expenses.write", "hr.expenses.approve"]);
    api.registerExpense.mockResolvedValue({ ok: true });
    await renderClaims();
    await interact(() => fireEvent.click(screen.getByRole("button", { name: "More actions for Printer ink" })));
    await interact(() => fireEvent.click(within(screen.getByRole("menu")).getByText("Register to a month")));
    const dialog = screen.getByRole("dialog", { name: "Register this claim to a month?" });
    fireEvent.change(within(dialog).getByLabelText(/Register to/), { target: { value: "2026-11" } });
    await interact(() => fireEvent.click(within(dialog).getByRole("button", { name: /Register claim/ })));
    expect(api.registerExpense).toHaveBeenCalledWith("e3", "2026-11");
  });

  test("a limited admin (role named admin, read only) sees no actions beyond opening", async () => {
    signIn("admin", ["hr.expenses.read"]);
    await renderClaims();
    expect(screen.queryByRole("button", { name: /New claim/ })).toBe(null);
    await interact(() => fireEvent.click(screen.getByRole("button", { name: "More actions for Taxi to client" })));
    expect(menuItems()).toEqual(["Open claim"]);
  });

  test("editing sends the form's own fields, never the populated owner reference", async () => {
    signIn("staff", STAFF);
    const onSubmit = jest.fn();
    await act(async () => {
      render(<ExpenseClaimFormModal open initial={claim({ approvedBy: { _id: "x" } })} onClose={() => {}} onSubmit={onSubmit} />);
    });
    await interact(() => fireEvent.click(screen.getByRole("button", { name: /Save changes/ })));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload).not.toHaveProperty("staffUserId");
    expect(payload).not.toHaveProperty("approvedBy");
    expect(payload).not.toHaveProperty("status");
    expect(payload.amount).toBe(85);
  });

  test("detail shows the approval history and only safe receipt links", async () => {
    signIn("finance", ["hr.expenses.read", "hr.expenses.approve"]);
    api.getExpense.mockResolvedValue({ ok: true, item: claim({ status: "registered", approvedAt: "2026-10-03T00:00:00Z", approvedBy: { fullName: "Mona Ali" }, registeredAt: "2026-10-05T00:00:00Z", registeredMonth: "2026-10", receiptUrl: "ftp://files.example/receipt.pdf" }) });
    await act(async () => {
      render(<ExpenseClaimDetailsPage />);
    });
    expect(screen.getByRole("list", { name: "Claim history" }).textContent).toMatch(/Approved by Mona Ali/);
    expect(screen.queryByRole("link", { name: /Open receipt/ })).toBe(null);
    expect(screen.getByRole("button", { name: /Mark as paid/ })).toBeTruthy();
  });

  test("monthly totals are plain figures (claims can be in different currencies)", async () => {
    signIn("finance", ["hr.expenses.read", "hr.expenses.approve"]);
    const y = String(new Date().getFullYear());
    api.getMonthlyExpenses.mockResolvedValue({ ok: true, items: [{ month: `${y}-09`, total: 1500, count: 4, paid: 1000, unpaid: 500 }] });
    await act(async () => {
      render(<MonthlyExpensesPage />);
    });
    const summary = screen.getByRole("region", { name: `Expense summary for ${y}` });
    expect(within(summary).getByText("1,500.00")).toBeTruthy();
    expect(summary.textContent).not.toMatch(/AED/);
  });
});

describe("HR overview", () => {
  test("loads only what the user may read and never turns a failure into zero", async () => {
    const access = signIn("hr_viewer", ["hr.staff.read", "hr.leaves.read"]);
    api.getStaffStats.mockResolvedValue({ ok: true, totals: { total: 20, active: 17, onLeave: 2, inactive: 1 }, byDepartment: [] });
    api.getLeaveStats.mockRejectedValue(new Error("down"));
    const data = await loadHrOverview(access);
    expect(api.getExpenseStats).not.toHaveBeenCalled();
    expect(api.listExpenses).not.toHaveBeenCalled();
    expect(api.listLeaves).not.toHaveBeenCalled(); // no approval queue without hr.leaves.approve
    const view = deriveHrOverview(data, access);
    const leaveMetric = view.metrics.find((m) => m.key === "leave");
    expect(leaveMetric.value).toBe("—");
    expect(view.metrics.find((m) => m.key === "staff").value).toBe(17);
    expect(view.failed).toEqual(["leaves"]);
  });

  test("the approval queue leaves out the approver's own requests", async () => {
    const access = signIn("hr_management", HR_MANAGER);
    api.getStaffStats.mockResolvedValue({ ok: true, totals: {} });
    api.listExpenses.mockResolvedValue(listOf([claim({ staffUserId: "me", title: "Mine" }), claim()]));
    const data = await loadHrOverview(access);
    const titles = deriveHrOverview(data, access).attention.map((a) => a.title);
    expect(titles.some((t) => t.includes("Mine"))).toBe(false);
    expect(titles.some((t) => t.includes("Taxi to client"))).toBe(true);
  });
});

describe("Staff records", () => {
  test("tabs follow effective permissions", () => {
    const tabs = (perms) => staffTabsFor(makeAccess({ role: "hr_viewer", permissions: perms }), { skills: [], learningGoals: [], scorecards: [] }).map((t) => t.id);
    expect(tabs(["hr.staff.read"])).toEqual(["overview", "goals"]);
    expect(tabs(["hr.staff.read", "hr.leaves.read", "hr.kpi.read", "activity.read"])).toEqual(["overview", "leave", "goals", "kpi", "history"]);
    expect(staffTabsFor(makeAccess({ role: "super_admin" }), {}).length).toBe(9);
  });

  test("leave and expense records are matched by exact name or linked user", () => {
    const staff = { fullName: "Ali Hassan", linkedUserId: { _id: "u2" } };
    expect(belongsToStaff({ staffName: "ali hassan " }, staff)).toBe(true);
    expect(belongsToStaff({ staffName: "Ali Hassanein" }, staff)).toBe(false);
    expect(belongsToStaff({ staffName: "Someone", staffUserId: { _id: "u2" } }, staff)).toBe(true);
  });

  test("delete is offered only with hr.staff.delete", async () => {
    signIn("hr_management", HR_MANAGER);
    api.listStaff.mockResolvedValue(listOf([{ _id: "s1", fullName: "Ali Hassan", department: "creative", status: "active" }]));
    api.getStaffStats.mockResolvedValue({ ok: true, totals: { total: 1, active: 1, onLeave: 0, inactive: 0 } });
    await act(async () => {
      render(<StaffPage />);
    });
    await interact(() => fireEvent.click(screen.getByRole("button", { name: "More actions for Ali Hassan" })));
    expect(menuItems()).toEqual(["Open record", "Edit record"]);
  });

  test("without IAM read access the form keeps the linked user and team out of the save", async () => {
    signIn("hr_management", HR_MANAGER);
    const onSubmit = jest.fn();
    await act(async () => {
      render(<StaffFormModal open initial={{ _id: "s1", fullName: "Ali Hassan", linkedUserId: { _id: "u2", fullName: "Ali" }, teamId: { _id: "t1", label: "Video" } }} onClose={() => {}} onSubmit={onSubmit} />);
    });
    expect(screen.getByLabelText("Portal user").value).toBe("Ali");
    await interact(() => fireEvent.click(screen.getByRole("button", { name: /Save changes/ })));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload).not.toHaveProperty("linkedUserId");
    expect(payload).not.toHaveProperty("teamId");
  });
});

describe("KPI", () => {
  const goal = { _id: "g1", indicatorId: { _id: "i1", name: "Client calls", unit: "calls", autoSource: "leaves_taken" }, scope: "individual", staffId: { fullName: "Ali Hassan" }, period: "2026-10", targetValue: 20, currentValue: 12, progressPct: 60, status: "active" };

  test("hr.kpi.read alone can look at goals and check-ins but change nothing", async () => {
    signIn("staff", STAFF);
    await act(async () => {
      render(<KpiGoalTable goals={[goal]} loading={false} onChanged={() => {}} />);
    });
    expect(screen.getByText(/60%: 12 of 20 calls/)).toBeTruthy();
    await interact(() => fireEvent.click(screen.getByRole("button", { name: "More actions for Client calls for 2026-10" })));
    expect(menuItems()).toEqual(["Show check-ins"]);
  });

  test("with hr.kpi.write, deleting an indicator warns that its goals and check-ins go too", async () => {
    signIn("hr_management", HR_MANAGER);
    api.listKPIIndicators.mockResolvedValue({ items: [{ _id: "i1", name: "Client calls", category: "performance", unit: "calls", direction: "higher_is_better", frequency: "monthly", autoSource: "none", isActive: true }] });
    await act(async () => {
      render(<KPIIndicatorsPage />);
    });
    await interact(() => fireEvent.click(screen.getByRole("button", { name: "More actions for Client calls" })));
    await interact(() => fireEvent.click(within(screen.getByRole("menu")).getByText("Delete indicator")));
    expect(screen.getByRole("alertdialog", { name: "Delete this indicator?" }).textContent).toMatch(/every check-in on those goals, is deleted too/);
  });
});

describe("Staff record page", () => {
  test("renders the record with only the tabs this user may open; salary sits under HR staff access", async () => {
    signIn("hr_viewer", ["hr.staff.read"]);
    mockParams = { id: "s1" };
    api.getStaff.mockResolvedValue({ ok: true, item: { _id: "s1", fullName: "Ali Hassan", jobTitle: "Editor", status: "active", department: "creative", monthlySalary: 9000, currency: "AED", skills: [], learningGoals: [], scorecards: [] } });
    await act(async () => {
      render(<StaffDetailsPage />);
    });
    expect(screen.getByRole("heading", { name: "Ali Hassan" })).toBeTruthy();
    expect(screen.getAllByRole("tab").map((t) => t.textContent.replace(/\d+$/, ""))).toEqual(["Overview", "Learning goals"]);
    expect(screen.queryByRole("button", { name: /Edit/ })).toBe(null);
    expect(screen.getByText("AED 9,000.00")).toBeTruthy();
  });
});

test("API mock covers every HR call", () => {
  expect(Object.keys(api).sort()).toEqual([...API].sort());
});
