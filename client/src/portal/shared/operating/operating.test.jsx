import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AgreementEditor from "./AgreementEditor";
import AgreementPanel from "./AgreementPanel";
import ManagedJobPanel from "./ManagedJobPanel";
import * as commands from "./api";

let mockAccess;
jest.mock("react-router-dom", () => {
  const React = require("react");
  return { MemoryRouter: ({ children }) => React.createElement(React.Fragment, null, children), Link: ({ to, children }) => React.createElement("a", { href: to }, children) };
}, { virtual: true });
jest.mock("../hooks/useAccess", () => ({ useAccess: () => mockAccess }));
jest.mock("./api", () => ({ ...jest.requireActual("./api"), overview: jest.fn(), options: jest.fn(), ownerAction: jest.fn(), periodAction: jest.fn(), jobAction: jest.fn() }));
jest.mock("../../features/services/api", () => ({ listServiceTemplates: jest.fn().mockResolvedValue({ items: [] }) }));
jest.mock("../../features/files/api", () => ({ listFiles: jest.fn().mockResolvedValue({ items: [] }) }));
jest.mock("../../features/jobs/api", () => ({ updateJob: jest.fn().mockResolvedValue({}) }));
const scope = { mode: "recurring", groups: [{ id: "social", title: "Social", jobs: [{ id: "posts", title: "Posts", type: "post", quantity: 6, unit: "posts" }, { id: "videos", title: "Videos", type: "video", quantity: 8, unit: "videos" }] }] };
const agreement = { id: "revision-1", number: 1, startDate: "2026-11-01", endDate: "2026-12-31", effectiveDate: "2026-11-01", timezone: "Asia/Dubai", scope, executionLeadId: "lead", accountOwnerId: "account", currency: "AED", price: 1000,
  approvalRoute: [{ id: "lead-step", purpose: "Team Lead review", source: "EXECUTION_LEAD", approverId: "lead", order: 0, required: true }, { id: "client-step", purpose: "Client approval", source: "CLIENT_EXTERNAL_RECORDED", approverId: "account", order: 1, required: true }] };
const directory = { users: [{ _id: "lead", fullName: "Delivery Lead" }, { _id: "account", fullName: "Account Manager" }], teams: [] };
function show(element) { return render(<MemoryRouter>{element}</MemoryRouter>); }
beforeEach(() => {
  jest.clearAllMocks(); const perms = new Set(["enrollments.read", "enrollments.write", "projects.read", "projects.write", "jobs.read", "jobs.write", "jobs.approve"]);
  mockAccess = { user: { id: "lead" }, isInternal: true, can: (p) => perms.has(p) };
  commands.options.mockResolvedValue(directory); commands.ownerAction.mockResolvedValue({ ok: true }); commands.periodAction.mockResolvedValue({ ok: true }); commands.jobAction.mockResolvedValue({ ok: true });
});
test("agreement confirmation uses actual client quantities and preserves stable line IDs", async () => {
  const save = jest.fn(); const owner = { _id: "enrollment", customerId: { _id: "client", contactName: "Client contact" }, serviceTemplateId: { _id: "service", scopeGroups: [{ jobs: [{ quantity: 999 }] }] }, finalScope: scope };
  show(<AgreementEditor kind="enrollment" owner={owner} directory={directory} onSave={save} />);
  await screen.findAllByLabelText("Quantity");
  const quantities = screen.getAllByLabelText("Quantity"); expect(quantities.map((n) => n.value)).toEqual(["6", "8"]);
  fireEvent.change(quantities[0], { target: { value: "10" } });
  for (const [label, value] of [["Agreement start", "2026-11-01"], ["Agreement end (inclusive)", "2026-12-31"], ["Effective cutover date", "2026-11-01"], ["Execution Lead", "lead"], ["Account responsibility (service override)", "account"], ["Proposal / contract reference", "Signed agreement"], ["Client acceptance date", "2026-10-01"], ["Acceptance / revision reason", "Actual purchased scope confirmed"]]) fireEvent.change(screen.getByLabelText(label), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Confirm delivery agreement" }));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ deliveryCadence: "monthly", scope: expect.objectContaining({ groups: [expect.objectContaining({ jobs: [expect.objectContaining({ id: "posts", quantity: 10 }), expect.objectContaining({ id: "videos", quantity: 8 })] })] }) }));
});
test("period UI distinguishes contractual entitlement, carry-in and workload", async () => {
  const owner = { _id: "enrollment", operatingModelVersion: 1, status: "active", activatedAt: "2026-11-01", agreementRevisions: [agreement] };
  const period = { _id: "december", timezone: "Asia/Dubai", periodStart: "2026-11-30T20:00:00Z", periodEnd: "2026-12-31T20:00:00Z", baseEntitlement: [],
    summary: [{ scopeLineId: "posts", title: "Posts", base: 6, extras: 0, carryIn: 1, workload: 7, completed: 0, waived: 0, outstanding: 6 }, { scopeLineId: "videos", title: "Videos", base: 8, extras: 0, carryIn: 1, workload: 9, completed: 0, waived: 0, outstanding: 8 }] };
  commands.overview.mockResolvedValue({ owner, periods: [period], jobs: [], outstanding: 16, displayState: "active" });
  show(<AgreementPanel kind="enrollment" owner={owner} />);
  const row = await screen.findByRole("row", { name: /Posts/ }); expect(within(row).getAllByRole("cell").map((c) => c.textContent)).toEqual(["Posts", "6", "0", "1", "7", "0", "0", "6"]);
  expect(screen.getByRole("columnheader", { name: "New entitlement" })).toBeInTheDocument(); expect(screen.getByRole("columnheader", { name: "Carry-in" })).toBeInTheDocument();
});
function job(overrides = {}) { return { _id: "job", operatingModelVersion: 1, status: "internal_review", assignees: [], agreementRevisionId: "revision-1", operating: { version: 3, disposition: "outstanding", route: agreement.approvalRoute, submission: { revision: 2, submittedAt: "2026-11-01", route: agreement.approvalRoute }, decisions: [], blockers: [], events: [] }, ...overrides }; }
test("approval permission does not expose another assigned person's decision action", () => {
  mockAccess.user = { id: "other" }; mockAccess.can = (p) => ["jobs.read", "jobs.approve"].includes(p); show(<ManagedJobPanel job={job()} />);
  expect(screen.queryByRole("button", { name: "Approve assigned step" })).not.toBeInTheDocument();
});
test("recorded client approval carries client identity, date, evidence and submitted revision", async () => {
  mockAccess.user = { id: "account" }; const item = job(); item.operating.decisions = [{ revision: 2, stepId: "lead-step", decision: "approved", requestId: "previous" }];
  show(<ManagedJobPanel job={item} />);
  fireEvent.change(screen.getByLabelText("Client contact"), { target: { value: "SAH reviewer" } });
  fireEvent.change(screen.getByLabelText("Client decision date"), { target: { value: "2026-10-01" } });
  fireEvent.change(screen.getByLabelText("Approval evidence / reference"), { target: { value: "Approval email" } });
  fireEvent.click(screen.getByRole("button", { name: "Record external client approval" }));
  await waitFor(() => expect(commands.jobAction).toHaveBeenCalledWith(item, "decide", expect.objectContaining({ revision: 2, stepId: "client-step", decision: "approved", clientContact: "SAH reviewer", clientApprovedAt: "2026-10-01", evidence: "Approval email" })));
});
test("phase acceptance uses the persisted phase identifier", async () => {
  const owner = { _id: "website", operatingModelVersion: 1, status: "active", activatedAt: "2026-11-01", agreementRevisions: [{ ...agreement, scope: { ...scope, mode: "phased_project" } }], phases: [{ id: "stable-uat", name: "UAT", order: 4, acceptanceRequirement: "Client accepted", acceptedAt: null, plannedStart: "2026-11-01", plannedEnd: "2026-12-01" }] };
  commands.overview.mockResolvedValue({ owner, jobs: [], periods: [], outstanding: 0, displayState: "active" });
  show(<AgreementPanel kind="project" owner={owner} />);
  fireEvent.change(await screen.findByLabelText("Action / exception reason"), { target: { value: "UAT outcome verified" } });
  fireEvent.click(screen.getByRole("button", { name: "Accept UAT" }));
  await waitFor(() => expect(commands.ownerAction).toHaveBeenCalledWith("project", "website", "accept-phase", expect.objectContaining({ phaseId: "stable-uat", reason: "UAT outcome verified" })));
});
