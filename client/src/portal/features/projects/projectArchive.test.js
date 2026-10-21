// Stage R3 (P2-4), kept through PUI-2 — the portal describes project
// removal as archiving and never offers a hard delete.
import fs from "fs";
import path from "path";
import { PROJECT_STATUS_OPTIONS } from "./constants";

jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn(), Link: () => null }), { virtual: true });
const { STATUS_FILTER_OPTIONS, ALL_INCLUDING_ARCHIVED, buildListParams } = require("./pages/ProjectsPage");

const read = (p) => fs.readFileSync(path.join(__dirname, p), "utf8");
const projectSources = () =>
  ["pages/ProjectDetailsPage.jsx", "pages/ProjectsPage.jsx", "components/ProjectHeader.jsx", "components/ProjectList.jsx"].map(read).join("\n");

test("archive confirmations say the history is kept, and nothing says delete", () => {
  for (const page of ["pages/ProjectDetailsPage.jsx", "pages/ProjectsPage.jsx"]) {
    const src = read(page);
    expect(src).toMatch(/title="Archive this project\?"/);
    expect(src).toMatch(/jobs, invoices, files and history are kept\. Nothing is deleted\./);
  }
  const all = projectSources();
  expect(all).not.toMatch(/cannot be undone/);
  expect(all).not.toMatch(/Delete project/i);
  expect(all).not.toMatch(/Trash2/);
});

test("the archive action is hidden once a project is archived", () => {
  expect(read("components/ProjectHeader.jsx")).toMatch(/onArchive && !archived/);
  expect(read("components/ProjectList.jsx")).toMatch(/canArchive && p\.status !== "archived"/);
});

test("the default list filter excludes archived projects and archived stays discoverable", () => {
  expect(PROJECT_STATUS_OPTIONS[0]).toEqual({ value: "", label: "All except archived" });
  expect(STATUS_FILTER_OPTIONS[0]).toEqual({ value: "", label: "All except archived" });
  expect(STATUS_FILTER_OPTIONS.map((o) => o.value)).toEqual(expect.arrayContaining(["archived", ALL_INCLUDING_ARCHIVED]));
  // Default: no status sent, so the API excludes archived (R3).
  expect(buildListParams({ status: "" })).not.toHaveProperty("status");
  expect(buildListParams({ status: "" })).not.toHaveProperty("includeArchived");
  expect(buildListParams({ status: "archived" }).status).toBe("archived");
  expect(buildListParams({ status: ALL_INCLUDING_ARCHIVED })).toMatchObject({ includeArchived: "true" });
  expect(buildListParams({ status: ALL_INCLUDING_ARCHIVED })).not.toHaveProperty("status");
});
