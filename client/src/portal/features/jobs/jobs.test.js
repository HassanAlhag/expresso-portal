// PI tail — Jobs list, job detail and the new-job dialog in the PUI design
// system, with permission-gated actions (R4-A). The API is mocked.
/* eslint-disable testing-library/no-node-access, testing-library/no-unnecessary-act */
import React from "react";
import fs from "fs";
import path from "path";
import { render, screen, fireEvent, within, act } from "@testing-library/react";

const mockNavigate = jest.fn();
let mockParams = { id: "j1" };
let mockSearch = new URLSearchParams();
const mockSetSearch = jest.fn();
jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");
    return {
      useNavigate: () => mockNavigate,
      useParams: () => mockParams,
      useLocation: () => ({ pathname: "/portal/jobs", state: null }),
      useSearchParams: () => [mockSearch, mockSetSearch],
      Navigate: () => null,
      Link: ({ to, children, ...rest }) => React.createElement("a", { href: to, ...rest }, children),
    };
  },
  { virtual: true }
);
jest.mock("./api", () => ({
  listJobs: jest.fn(),
  getJob: jest.fn(),
  createJob: jest.fn(),
  updateJob: jest.fn(),
  deleteJob: jest.fn(),
  bulkAssignJobs: jest.fn(),
  bulkDeleteJobs: jest.fn(),
  attachMedia: jest.fn(),
  addApproval: jest.fn(),
  publishJob: jest.fn(),
}));
jest.mock("../customers/api", () => ({ listCustomers: jest.fn(() => Promise.resolve({ items: [] })) }));
jest.mock("../projects/api", () => ({ listProjects: jest.fn(() => Promise.resolve({ items: [] })) }));
jest.mock("../enrollments/api", () => ({ listEnrollments: jest.fn(() => Promise.resolve({ items: [] })) }));
jest.mock("../iam/users/api", () => ({ listUsers: jest.fn() }));
jest.mock("../media-library/components/MediaPickerModal", () => () => null);
const mockToast = { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() };
jest.mock("../../shared/ui/Toast", () => ({ useToast: () => mockToast }));

const api = require("./api");
const usersApi = require("../iam/users/api");
const JobsPage = require("./pages/JobsPage").default;
const JobDetailsPage = require("./pages/JobDetailsPage").default;
const NewJobModal = require("./components/NewJobModal").default;

const READ = ["jobs.read"];
const WRITE = ["jobs.read", "jobs.write", "iam.users.read", "customers.read", "projects.read"];
const ALL = [...WRITE, "jobs.delete"];

function signIn(permissions, role = "staff") {
  localStorage.setItem("portal_token", "t");
  localStorage.setItem("portal_user", JSON.stringify({ fullName: "Layla Haddad", role, permissions, isInternal: true }));
  localStorage.setItem("portal_permissions", JSON.stringify(permissions));
}

const job = (over = {}) => ({
  _id: "j1",
  title: "Autumn campaign banner",
  status: "editing",
  type: "design",
  priority: "normal",
  customerId: { _id: "c1", companyName: "Acme Company" },
  projectId: { _id: "p1", name: "Autumn campaign" },
  assignees: [{ _id: "u1", fullName: "Rania Aziz" }],
  dueDate: "2099-12-18",
  approvals: [],
  media: [],
  ...over,
});

const page = (items, total = items.length, pageNo = 1, pages = 1, limit = 20) => ({ ok: true, items, total, page: pageNo, pages, limit });
const listCalls = () => api.listJobs.mock.calls.map((c) => c[0]).filter((p) => p.limit !== 1);
const lastList = () => listCalls().at(-1);

function mockList(impl) {
  api.listJobs.mockImplementation((p) => (p.limit === 1 ? Promise.resolve({ total: p.status === "on_hold" ? 1 : 2, items: [] }) : impl(p)));
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockParams = { id: "j1" };
  mockSearch = new URLSearchParams();
  mockList(() => Promise.resolve(page([job(), job({ _id: "j2", title: "Menu photos", status: "on_hold" })])));
  usersApi.listUsers.mockResolvedValue({ users: [{ _id: "u1", fullName: "Rania Aziz" }, { _id: "u2", fullName: "Omar Saleh" }] });
});

async function settle(fn) {
  await act(async () => {
    fn?.();
  });
  await act(() => new Promise((r) => setTimeout(r, 350)));
}
async function renderJobs() {
  await settle(() => render(<JobsPage />));
}

// ═══ Jobs list ═══════════════════════════════════════════════════════════════
describe("Jobs page", () => {
  test("shows loading, then the board with honest counts and no video jobs", async () => {
    signIn(ALL);
    let resolve;
    mockList(() => new Promise((r) => (resolve = r)));
    await act(async () => {
      render(<JobsPage />);
    });
    expect(screen.getByText("Loading jobs…")).toBeTruthy();
    await settle(() => resolve(page([job()], 1)));
    expect(lastList()).toMatchObject({ notWorkflowType: "video", page: 1, limit: 100 });
    expect(screen.getByRole("list", { name: "Jobs by stage" })).toBeTruthy();
    expect(screen.getByText("1 of 1 job on the board, newest first")).toBeTruthy();
    const summary = screen.getByRole("region", { name: "Jobs summary" });
    expect(within(summary).getByText("Matching jobs")).toBeTruthy();
    expect(within(summary).getByText("In review")).toBeTruthy();
    expect(screen.getByText(/Video and reel production is in/)).toBeTruthy();
  });

  test("says when the board shows only part of the matching jobs", async () => {
    signIn(ALL);
    mockList(() => Promise.resolve(page([job()], 140, 1, 2, 100)));
    await renderJobs();
    expect(screen.getByText("The board shows the 1 newest of 140 matching jobs")).toBeTruthy();
  });

  test("an error offers a retry that loads the jobs", async () => {
    signIn(ALL);
    let fail = true;
    mockList(() => (fail ? Promise.reject({ response: { data: { message: "Server unavailable" } } }) : Promise.resolve(page([job()]))));
    await renderJobs();
    expect(screen.getByText("Jobs didn't load")).toBeTruthy();
    fail = false;
    await settle(() => fireEvent.click(screen.getByRole("button", { name: /Try again/ })));
    expect(screen.getByRole("link", { name: "Autumn campaign banner" })).toBeTruthy();
  });

  test("a true empty state differs from a filtered empty state", async () => {
    signIn(ALL);
    mockList(() => Promise.resolve(page([], 0)));
    await renderJobs();
    expect(screen.getByText("No jobs yet")).toBeTruthy();
    await settle(() => fireEvent.change(screen.getByLabelText("Status"), { target: { value: "on_hold" } }));
    expect(screen.getByText("No jobs match these filters")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeTruthy();
  });

  test("list view paginates on the server and resets to page 1 when filters change", async () => {
    signIn(ALL);
    localStorage.setItem("portal_jobs_view", "list");
    mockList((p) => Promise.resolve(page([job({ _id: `j${p.page}`, title: `Job on page ${p.page}` })], 45, p.page, 3)));
    await renderJobs();
    expect(lastList()).toMatchObject({ page: 1, limit: 20 });
    await settle(() => fireEvent.click(screen.getByRole("button", { name: /^Page 2$|^2$/ })));
    expect(lastList()).toMatchObject({ page: 2, limit: 20 });
    expect(screen.getByRole("link", { name: "Job on page 2" })).toBeTruthy();
    await settle(() => fireEvent.change(screen.getByLabelText("Type"), { target: { value: "photo" } }));
    expect(lastList()).toMatchObject({ page: 1, type: "photo" });
  });

  test("filters from the address are applied (dashboard links), video included on request", async () => {
    signIn(ALL);
    mockSearch = new URLSearchParams("status=internal_review,client_review&workflow=all");
    await renderJobs();
    const params = lastList();
    expect(params.status).toBe("internal_review,client_review");
    expect(params).not.toHaveProperty("notWorkflowType");
    expect(screen.getByRole("button", { name: /Remove filter Including video production jobs/ })).toBeTruthy();
    expect(screen.getByLabelText("Status").value).toBe("internal_review,client_review");
  });

  test("an unknown address filter is ignored", async () => {
    signIn(ALL);
    mockSearch = new URLSearchParams("status=whatever&type=event");
    await renderJobs();
    expect(lastList().status).toBe("");
    expect(lastList().type).toBe("");
  });

  test("read-only users see jobs but no create, move, edit, delete or selection", async () => {
    signIn(READ);
    await renderJobs();
    expect(screen.queryByRole("button", { name: /New job/ })).toBe(null);
    expect(screen.queryByRole("button", { name: /Move .* on to/ })).toBe(null);
    await settle(() => fireEvent.click(screen.getByRole("radio", { name: /List/ })));
    expect(screen.queryByRole("checkbox")).toBe(null);
    await settle(() => fireEvent.click(screen.getByRole("button", { name: "More actions for Autumn campaign banner" })));
    const items = screen.getAllByRole("menuitem").map((i) => i.textContent);
    expect(items).toEqual(["Open job"]);
  });

  test("jobs.write can create, move and edit but not delete; jobs.delete adds delete", async () => {
    signIn(WRITE);
    await renderJobs();
    expect(screen.getByRole("button", { name: /New job/ })).toBeTruthy();
    api.updateJob.mockResolvedValue({ ok: true });
    await settle(() => fireEvent.click(screen.getByRole("button", { name: "Move Autumn campaign banner on to Review" })));
    expect(api.updateJob).toHaveBeenCalledWith("j1", { status: "internal_review" });
    await settle(() => fireEvent.click(screen.getByRole("radio", { name: /List/ })));
    await settle(() => fireEvent.click(screen.getByRole("button", { name: "More actions for Autumn campaign banner" })));
    expect(screen.getAllByRole("menuitem").map((i) => i.textContent)).toEqual(["Open job", "Edit job"]);
    await settle(() => fireEvent.click(screen.getAllByRole("checkbox")[1]));
    expect(screen.getByRole("button", { name: /Assign staff/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Delete selected/ })).toBe(null);
  });

  test("jobs.delete confirms before deleting one job or a selection", async () => {
    signIn(ALL);
    localStorage.setItem("portal_jobs_view", "list");
    api.deleteJob.mockResolvedValue({ ok: true });
    api.bulkDeleteJobs.mockResolvedValue({ ok: true, deleted: 2 });
    await renderJobs();
    await settle(() => fireEvent.click(screen.getByRole("button", { name: "More actions for Autumn campaign banner" })));
    await settle(() => fireEvent.click(screen.getByRole("menuitem", { name: /Delete job/ })));
    const dialog = screen.getByRole("alertdialog", { name: "Delete this job?" });
    await settle(() => fireEvent.click(within(dialog).getByRole("button", { name: "Delete job" })));
    expect(api.deleteJob).toHaveBeenCalledWith("j1");
    await settle(() => fireEvent.click(screen.getByRole("checkbox", { name: "Select all jobs on this page" })));
    await settle(() => fireEvent.click(screen.getByRole("button", { name: /Delete selected/ })));
    await settle(() => fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete jobs" })));
    expect(api.bulkDeleteJobs).toHaveBeenCalledWith(["j1", "j2"]);
  });

  test("the board/list choice switches the request and is remembered", async () => {
    signIn(ALL);
    await renderJobs();
    expect(lastList().limit).toBe(100);
    await settle(() => fireEvent.click(screen.getByRole("radio", { name: /List/ })));
    expect(lastList().limit).toBe(20);
    expect(localStorage.getItem("portal_jobs_view")).toBe("list");
    expect(screen.getByRole("table", { name: "Jobs" })).toBeTruthy();
  });

  test("create success opens the new job; a failure keeps the dialog open", async () => {
    signIn(ALL);
    require("../customers/api").listCustomers.mockResolvedValue({ items: [{ _id: "c1", companyName: "Acme Company" }] });
    api.createJob.mockRejectedValueOnce({ response: { data: { message: "Customer not found" } } }).mockResolvedValueOnce({ ok: true, item: { _id: "new1" } });
    await renderJobs();
    await settle(() => fireEvent.click(screen.getByRole("button", { name: /New job/ })));
    const dialog = screen.getByRole("dialog", { name: "New job" });
    expect(within(dialog).getByRole("button", { name: /Create job/ }).disabled).toBe(true);
    await settle(() => fireEvent.click(within(dialog).getByRole("button", { name: /Client/ })));
    await settle(() => fireEvent.click(within(dialog).getByRole("button", { name: /Acme Company/ })));
    fireEvent.change(within(dialog).getByLabelText(/Title/), { target: { value: "Spring flyer" } });
    await settle(() => fireEvent.click(within(dialog).getByRole("button", { name: /Create job/ })));
    expect(screen.getByRole("dialog", { name: "New job" })).toBeTruthy();
    expect(within(dialog).getByRole("alert").textContent).toMatch("Customer not found");
    expect(mockNavigate).not.toHaveBeenCalled();
    await settle(() => fireEvent.click(within(dialog).getByRole("button", { name: /Create job/ })));
    expect(api.createJob).toHaveBeenLastCalledWith(expect.objectContaining({ customerId: "c1", title: "Spring flyer" }));
    expect(mockNavigate).toHaveBeenCalledWith("/portal/jobs/new1");
  });
});

// ═══ New job dialog (shared by Jobs, Project and Client pages) ═════════════════
describe("New job dialog", () => {
  const client = { _id: "c1", companyName: "Acme Company" };

  async function openDialog(props = {}) {
    const onClose = jest.fn();
    const createJob = props.createJob || jest.fn(() => Promise.resolve({ item: { _id: "n1" } }));
    await settle(() =>
      render(<NewJobModal open onClose={onClose} createJob={createJob} listCustomers={jest.fn()} listProjects={jest.fn(() => Promise.resolve({ items: [] }))} initialCustomer={client} lockCustomer />)
    );
    return { onClose, createJob };
  }

  test("only API job types are offered (no Event)", async () => {
    signIn(ALL);
    await openDialog();
    const types = [...screen.getByLabelText("Type").querySelectorAll("option")].map((o) => o.value);
    expect(types).toEqual(["task", "post", "story", "carousel", "design", "page", "photo", "case_study", "other"]);
  });

  test("a failed create keeps the dialog open with the values and the server's message", async () => {
    signIn(ALL);
    const createJob = jest.fn(() => Promise.reject({ response: { data: { message: "Assignees must be active staff members" } } }));
    const { onClose } = await openDialog({ createJob });
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: "Spring flyer" } });
    await settle(() => fireEvent.click(screen.getByRole("checkbox", { name: "Omar Saleh" })));
    await settle(() => fireEvent.click(screen.getByRole("button", { name: /Create job/ })));
    expect(createJob).toHaveBeenCalledTimes(1);
    expect(createJob.mock.calls[0][0]).toMatchObject({ customerId: "c1", title: "Spring flyer", assignees: ["u2"] });
    expect(screen.getByRole("alert").textContent).toMatch("Assignees must be active staff members");
    expect(screen.getByLabelText(/Title/).value).toBe("Spring flyer");
    expect(screen.getByRole("dialog", { name: "New job" })).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });

  test("a successful create closes the dialog once", async () => {
    signIn(ALL);
    const { onClose, createJob } = await openDialog();
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: "Spring flyer" } });
    await settle(() => {
      fireEvent.click(screen.getByRole("button", { name: /Create job/ }));
      fireEvent.click(screen.getByRole("button", { name: /Create job/ }));
    });
    expect(createJob).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith(true);
  });

  test("without the user directory, staff selection is explained and not sent", async () => {
    signIn(["jobs.read", "jobs.write"]);
    const { createJob } = await openDialog();
    expect(screen.getByText("Staff can't be chosen here")).toBeTruthy();
    expect(usersApi.listUsers).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: "Spring flyer" } });
    await settle(() => fireEvent.click(screen.getByRole("button", { name: /Create job/ })));
    expect(createJob.mock.calls[0][0]).not.toHaveProperty("assignees");
  });
});

// ═══ Job detail ══════════════════════════════════════════════════════════════
describe("Job detail", () => {
  async function renderJob() {
    await settle(() => render(<JobDetailsPage />));
  }

  test("an error offers a retry; a missing job says so without one", async () => {
    signIn(ALL);
    api.getJob.mockRejectedValueOnce({ response: { status: 500 } }).mockResolvedValueOnce({ item: job() });
    await renderJob();
    expect(screen.getByText("This job didn't load")).toBeTruthy();
    await settle(() => fireEvent.click(screen.getByRole("button", { name: /Try again/ })));
    expect(screen.getByRole("heading", { level: 1, name: "Autumn campaign banner" })).toBeTruthy();
  });

  test("a deleted job shows Not found", async () => {
    signIn(ALL);
    api.getJob.mockRejectedValue({ response: { status: 404 } });
    await renderJob();
    expect(screen.getByText("Job not found")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Try again/ })).toBe(null);
  });

  test("read-only users see the job without any write or delete control", async () => {
    signIn(READ);
    api.getJob.mockResolvedValue({ item: job() });
    await renderJob();
    for (const name of [/^Edit$/, /Delete/, /Publish to website/, /Mark as in client review/, /Attach/, /^Save$/]) {
      expect(screen.queryByRole("button", { name })).toBe(null);
    }
    expect(screen.queryByLabelText("Change status")).toBe(null);
    expect(screen.getByLabelText("Notes").readOnly).toBe(true);
    expect(screen.queryByRole("button", { name: /Remove Rania Aziz/ })).toBe(null);
  });

  test("jobs.write can change to any status, publish and edit; delete needs jobs.delete", async () => {
    signIn(WRITE);
    api.getJob.mockResolvedValue({ item: job() });
    api.updateJob.mockResolvedValue({ ok: true });
    await renderJob();
    expect(screen.getByRole("button", { name: /Publish to website/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Edit$/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Delete$/ })).toBe(null);
    await settle(() => fireEvent.change(screen.getByLabelText("Change status"), { target: { value: "archived" } }));
    expect(api.updateJob).toHaveBeenCalledWith("j1", { status: "archived" });
  });

  test("jobs.delete shows Delete behind a confirmation", async () => {
    signIn(ALL);
    api.getJob.mockResolvedValue({ item: job() });
    api.deleteJob.mockResolvedValue({ ok: true });
    await renderJob();
    await settle(() => fireEvent.click(screen.getByRole("button", { name: /^Delete$/ })));
    await settle(() => fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete job" })));
    expect(api.deleteJob).toHaveBeenCalledWith("j1");
    expect(mockNavigate).toHaveBeenCalledWith("/portal/jobs");
  });

  test.each([
    ["on_hold", "On hold"],
    ["archived", "Archived"],
  ])("status %s is labelled and placed on the board stages (no dash)", async (status, label) => {
    signIn(ALL);
    api.getJob.mockResolvedValue({ item: job({ status }) });
    await renderJob();
    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    expect(screen.getByText(`Status: ${label} · on the board under Done`)).toBeTruthy();
  });

  test("client review is described as staff-recorded; nothing says it was sent to the client", async () => {
    signIn(ALL);
    api.getJob.mockResolvedValue({ item: job({ status: "client_review", media: [{ _id: "m1", url: "/a.png", type: "image" }] }) });
    await renderJob();
    expect(screen.getByText("In client review")).toBeTruthy();
    expect(screen.getByText(/Clients can't open jobs in the portal/)).toBeTruthy();
    expect(screen.queryByText(/Send to client/)).toBe(null);
    expect(screen.getByRole("button", { name: /Mark as in client review/ })).toBeTruthy();
  });

  test("marking client review records the status and a note", async () => {
    signIn(ALL);
    api.getJob.mockResolvedValue({ item: job() });
    api.updateJob.mockResolvedValue({ ok: true });
    api.addApproval.mockResolvedValue({ ok: true });
    await renderJob();
    await settle(() => fireEvent.click(screen.getByRole("button", { name: /Mark as in client review/ })));
    expect(api.updateJob).toHaveBeenCalledWith("j1", { status: "client_review" });
    expect(api.addApproval).toHaveBeenCalledWith("j1", { status: "client_sent", note: "Marked as in client review." });
  });

  test("the page keeps no stage or status list of its own", () => {
    const src = fs.readFileSync(path.join(__dirname, "pages", "JobDetailsPage.jsx"), "utf8");
    expect(src).not.toMatch(/PIPELINE_STAGES/);
    expect(src).not.toMatch(/\{\s*key:\s*"brief"/);
    expect(src).toMatch(/from "\.\.\/pipeline"/);
  });
});
