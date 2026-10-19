// Shared safety check for scripts that write to the database.
// Refuses to run against a remote (e.g. Atlas) database unless the operator
// confirms with --allow-remote, so a seed or migration is never pointed at
// production by accident (audit: seed scripts share the app's MONGO_URI).
export function assertSafeTarget() {
  const uri = process.env.MONGO_URI || "";
  let host = "";
  try {
    host = new URL(uri.replace(/^mongodb(\+srv)?:/, "http:")).hostname;
  } catch {
    host = "";
  }
  const local = ["localhost", "127.0.0.1", "::1", "mongo", ""].includes(host);
  if (!local && !process.argv.includes("--allow-remote")) {
    console.error(
      `Refusing to run against remote database host "${host}".\n` +
        "Point MONGO_URI at a local/staging database, or re-run with --allow-remote if you really mean it."
    );
    process.exit(2);
  }
  if (!local) console.warn(`⚠️  Running against REMOTE database host ${host}`);
}
