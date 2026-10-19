// Shared safety check for scripts that touch the database.
//
// - Local databases (localhost) are always allowed.
// - A remote database is allowed only when portal-api/.env declares
//   DB_ENVIRONMENT=staging (the staging cluster), or the operator passes
//   --allow-remote explicitly.
// - DB_ENVIRONMENT=production is refused for writing scripts unless
//   --allow-production is passed as well.
// This keeps seeds, fixtures and migrations off production by default.
export function dbHost(uri = process.env.MONGO_URI || "") {
  try {
    return new URL(uri.replace(/^mongodb(\+srv)?:/, "http:")).hostname;
  } catch {
    return "";
  }
}

export function assertSafeTarget({ readOnly = false } = {}) {
  const host = dbHost();
  const declared = String(process.env.DB_ENVIRONMENT || "").toLowerCase();
  const local = ["localhost", "127.0.0.1", "::1", "mongo", ""].includes(host);
  const args = process.argv;

  if (declared === "production" && !readOnly && !args.includes("--allow-production")) {
    console.error(
      "Refusing to run a writing script against DB_ENVIRONMENT=production.\n" +
        "Use the staging database. If this is truly intended, add --allow-production."
    );
    process.exit(2);
  }
  if (!local && declared !== "staging" && !args.includes("--allow-remote")) {
    console.error(
      `Refusing to run against remote database host "${host}".\n` +
        "Set DB_ENVIRONMENT=staging in the staging .env, point MONGO_URI at a local database,\n" +
        "or re-run with --allow-remote if you really mean it."
    );
    process.exit(2);
  }
  if (!local) console.warn(`⚠️  Database host ${host} (DB_ENVIRONMENT=${declared || "unset"})`);
}
