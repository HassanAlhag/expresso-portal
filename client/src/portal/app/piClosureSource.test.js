// PI closure — source regression: older portal pages decide actions from
// effective permissions (useAccess), not client-side role-name lists.
const fs = require("fs");
const path = require("path");

const FEATURES = path.join(__dirname, "..", "features");
function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (/\.(jsx?|tsx?)$/.test(name) && !/\.test\./.test(name)) out.push(p);
  }
  return out;
}
const read = (rel) => fs.readFileSync(path.join(FEATURES, rel), "utf8");
const files = walk(FEATURES).filter((f) => !f.includes(`${path.sep}productions${path.sep}`));

it("no isAdminRole helper or readCurrentUser role check remains", () => {
  const hits = files.filter((f) => /isAdminRole|readCurrentUser/.test(fs.readFileSync(f, "utf8")));
  expect(hits.map((f) => path.relative(FEATURES, f))).toEqual([]);
});

it("no page authorises with a list of internal role names", () => {
  // A role-name array/Set containing several staff roles used with includes/has.
  const pattern = /\[\s*"super_admin",\s*"admin",[^\]]*\]\s*\.includes\(|INTERNAL_ROLES|ADMIN_ROLES|STAFF_ROLES/;
  const hits = files.filter((f) => pattern.test(fs.readFileSync(f, "utf8")));
  expect(hits.map((f) => path.relative(FEATURES, f))).toEqual([]);
});

it("Messages and Brand Kit classify by isInternal, not by role names", () => {
  for (const rel of ["messaging/pages/MessagesPage.jsx", "brand-kit/pages/BrandKitPage.jsx"]) {
    const src = read(rel);
    expect(src).toMatch(/isClient = !access\.isInternal/);
    expect(src).not.toMatch(/\["client",|"staff_client"|"client_admin"/);
  }
});

it("aligned pages read effective permissions through useAccess", () => {
  const expected = {
    "media-library/pages/MediaLibraryPage.jsx": ["media.write"],
    "media-library/components/MediaDrawer.jsx": ["media.write", "media.delete"],
    "media-library/components/MediaPickerModal.jsx": ["media.read", "media.write"],
    "services/pages/ServicesPage.jsx": ["services.write", "services.delete"],
    "services/pages/ServiceBuilderPage.jsx": ["services.write"],
    "services/pages/ServiceDetailsPage.jsx": ["services.write", "services.delete"],
    "enrollments/pages/EnrollmentsPage.jsx": ["enrollments.write"],
    "enrollments/pages/EnrollmentDetailsPage.jsx": ["enrollments.write", "enrollments.delete", "jobs.write"],
    "social/pages/ContentCalendarPage.jsx": ["jobs.write", "social.metrics.write"],
    "messaging/pages/MessagesPage.jsx": ["messaging.write"],
    "brand-kit/pages/BrandKitPage.jsx": ["brand_kit.write"],
    "iam/users/components/UserTable.jsx": ["iam.users.write", "iam.users.delete"],
    "iam/users/pages/UsersListPage.jsx": ["iam.users.write"],
    "iam/users/pages/UserDetailsPage.jsx": ["iam.users.write"],
    "iam/roles/pages/RolesPage.jsx": ["iam.roles.write"],
    "iam/teams/pages/TeamsPage.jsx": ["iam.teams.write"],
    "careers/pages/CareersAdminPage.jsx": ["website.write"],
    "website/pages/HomepageSlidersPage.jsx": ["website.write"],
    "website/pages/WebsiteSettingsPage.jsx": ["website.write"],
    "website/pages/DigitalServicesPage.jsx": ["website.write"],
    "website/pages/TechSolutionsPage.jsx": ["website.write"],
    "portfolio/pages/PortfolioPage.jsx": ["portfolio.write", "portfolio.delete"],
    "portfolio/pages/PortfolioDetailsPage.jsx": ["portfolio.write", "portfolio.delete"],
    "tickets/pages/TicketDetailsPage.jsx": ["tickets.write", "tickets.delete"],
  };
  for (const [rel, perms] of Object.entries(expected)) {
    const src = read(rel);
    expect([rel, /useAccess\(\)/.test(src)]).toEqual([rel, true]);
    for (const p of perms) expect([rel, src.includes(`can("${p}")`)]).toEqual([rel, true]);
  }
  // No invented permission key.
  expect(read("brand-kit/pages/BrandKitPage.jsx")).not.toMatch(/can\("brand_kit\.delete"\)/);
});
