// Initial Portfolio work items (development seed / one-time migration).
//
//   node src/scripts/seedWorkItems.js            # dry run: prints the plan, writes nothing
//   node src/scripts/seedWorkItems.js --apply    # inserts the missing drafts
//
// Safety:
// - Insert-only. An item whose slug already exists is skipped, never updated,
//   so admin edits survive re-runs. Nothing is ever deleted.
// - Every item is created as a DRAFT; publishing is an admin decision.
// - Case studies (the Portfolio collection) are only read, never written.
// - Refuses DB_ENVIRONMENT=production unconditionally, and remote hosts unless
//   the shared guard allows them (see _guard.js).
import "dotenv/config";
import mongoose from "mongoose";
import { pathToFileURL } from "node:url";
import { connectDB } from "../config/db.js";
import Portfolio from "../modules/portfolio/portfolio.model.js";
import WorkItem from "../modules/portfolio/workItem.model.js";
import { LINKED_CASE_STUDIES, VISUAL_ONLY_CASE_STUDIES, planWorkItemSeed } from "../modules/portfolio/workItem.seedPlan.js";
import { assertSafeTarget } from "./_guard.js";

async function run() {
  if (String(process.env.DB_ENVIRONMENT || "").toLowerCase() === "production") {
    console.error("Refusing to seed portfolio work items into DB_ENVIRONMENT=production.");
    process.exit(2);
  }
  assertSafeTarget();
  const apply = process.argv.includes("--apply");
  await connectDB();

  const slugs = [...LINKED_CASE_STUDIES, ...VISUAL_ONLY_CASE_STUDIES];
  const caseStudies = new Map(
    (await Portfolio.find({ slug: { $in: slugs } }).populate("coverMedia", "url").lean()).map((cs) => [cs.slug, cs])
  );
  const existing = new Set((await WorkItem.find({}).select("slug").lean()).map((w) => w.slug));
  const { create, skipped } = planWorkItemSeed(caseStudies, existing);

  for (const s of skipped) console.log(`- skip ${s.slug}: ${s.reason}`);
  for (const { draft, source } of create) {
    if (apply) {
      await WorkItem.create(draft);
      console.log(`+ created draft ${draft.slug} (${source})`);
    } else {
      console.log(`~ would create draft ${draft.slug} (${source})`);
    }
  }
  if (!apply) console.log("Dry run. Re-run with --apply to insert the drafts above.");
  await mongoose.connection.close();
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  run().catch((err) => {
    console.error("seedWorkItems failed:", err?.message || err);
    process.exit(1);
  });
}
