// Creates the CAS record in the Solutions CMS as a Digital Solution
// (kind=digital, Built by Expresso). Safe to re-run: it only INSERTS when no
// "cas" record exists, so edits made later in the portal are never overwritten.
//   node src/scripts/seedDigitalSolutions.js
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { assertSafeTarget } from "./_guard.js";
import Solution from "../modules/web-content/solution.model.js";

const CAS = {
  slug: "cas",
  kind: "digital",
  ownership: "expresso",
  title: "CAS",
  subtitle: "Clinic Appointment System",
  tagline: "A clinic appointment platform designed and developed by Expresso Digital.",
  description:
    "CAS connects a simple patient booking experience with the tools a clinic team needs to manage doctors, schedules, and appointments.",
  badge: "Built by Expresso",
  ctaLabel: "Explore CAS",
  demoCtaLabel: "Request a Demo",
  demoCtaHref: "/contact-us?interest=cas-demo",
  customPage: "cas",
  icon: "software",
  heroImageUrl: "/images/products/cas/cas-admin-dashboard.webp",
  order: 0,
  isActive: true,
};

assertSafeTarget();
await connectDB();
const res = await Solution.updateOne({ slug: CAS.slug }, { $setOnInsert: CAS }, { upsert: true });
console.log(res.upsertedCount ? "✅ CAS created as a Digital Solution" : "ℹ️  A 'cas' solution already exists — left unchanged");
await mongoose.disconnect();
