// Stage R3 (P2-4) — the portal describes project removal as archiving.
import fs from "fs";
import path from "path";
import { PROJECT_STATUS_OPTIONS } from "./constants";

const read = (p) => fs.readFileSync(path.join(__dirname, p), "utf8");

test("the project action archives and says the history is kept", () => {
  const page = read("pages/ProjectDetailsPage.jsx");
  expect(page).toMatch(/title: "Archive project"/);
  expect(page).toMatch(/keeps its jobs, invoices, files and history/);
  expect(page).not.toMatch(/cannot be undone/);
  expect(page).not.toMatch(/Delete project/);
});

test("the header button is an archive control with an accessible name, hidden once archived", () => {
  const header = read("components/ProjectHeader.jsx");
  expect(header).toMatch(/aria-label="Archive project"/);
  expect(header).toMatch(/project\?\.status !== "archived"/);
  expect(header).not.toMatch(/Trash2/);
});

test("the default list filter is labelled as excluding archived projects", () => {
  expect(PROJECT_STATUS_OPTIONS[0]).toEqual({ value: "", label: "All except archived" });
  expect(PROJECT_STATUS_OPTIONS.some((o) => o.value === "archived")).toBe(true);
});
