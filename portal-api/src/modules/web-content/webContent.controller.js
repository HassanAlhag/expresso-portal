import mongoose from "mongoose";
import DigitalService from "./digitalService.model.js";
import Solution from "./solution.model.js";
import {
  TECHNOLOGY_GROUPS,
  TECHNOLOGY_GROUP_IDS,
  defaultTechnologyGroup,
  withTechnologyGroup,
} from "./technologyGroups.js";

function validId(id) {
  return id && mongoose.Types.ObjectId.isValid(id);
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Digital Services ─────────────────────────────────────────────────────────

export async function listServices(req, res) {
  try {
    const { includeInactive } = req.query;
    const filter = {};
    if (!includeInactive) filter.isActive = true;
    const items = await DigitalService.find(filter).sort({ order: 1, createdAt: 1 }).lean();
    return res.json({ ok: true, items });
  } catch (e) {
    console.error("listServices:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getServiceBySlug(req, res) {
  try {
    const { slug } = req.params;
    const item = await DigitalService.findOne({ slug: String(slug).trim() }).lean();
    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    return res.json({ ok: true, item });
  } catch (e) {
    console.error("getServiceBySlug:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function createService(req, res) {
  try {
    const {
      title, tag, description, imageUrl, imageMediaId,
      slug, heroHeading, heroSubheading, heroImageUrl, heroImageMediaId,
      heroCtaText, heroCtaLink, blocks, order, isActive,
    } = req.body || {};
    if (!String(title || "").trim()) {
      return res.status(400).json({ ok: false, message: "title is required" });
    }
    const normalizedSlug = slugify(slug || title);
    if (!normalizedSlug) {
      return res.status(400).json({ ok: false, message: "slug is required" });
    }
    const item = await DigitalService.create({
      title: String(title).trim(),
      tag: String(tag || "").trim(),
      description: String(description || "").trim(),
      imageUrl: String(imageUrl || "").trim(),
      imageMediaId: validId(imageMediaId) ? imageMediaId : null,
      slug: normalizedSlug,
      heroHeading: String(heroHeading || "").trim(),
      heroSubheading: String(heroSubheading || "").trim(),
      heroImageUrl: String(heroImageUrl || "").trim(),
      heroImageMediaId: validId(heroImageMediaId) ? heroImageMediaId : null,
      heroCtaText: String(heroCtaText || "Get Started").trim(),
      heroCtaLink: String(heroCtaLink || "/contact-us").trim(),
      blocks: Array.isArray(blocks) ? blocks : [],
      order: typeof order === "number" ? order : Number(order) || 0,
      isActive: isActive !== false,
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
    });
    return res.status(201).json({ ok: true, item });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ ok: false, message: "Slug already in use" });
    console.error("createService:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateService(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });
    const body = req.body || {};
    const patch = { updatedBy: req.user?.id || null };
    if (typeof body.title !== "undefined") patch.title = String(body.title || "").trim();
    if (typeof body.tag !== "undefined") patch.tag = String(body.tag || "").trim();
    if (typeof body.description !== "undefined") patch.description = String(body.description || "").trim();
    if (typeof body.imageUrl !== "undefined") patch.imageUrl = String(body.imageUrl || "").trim();
    if (typeof body.imageMediaId !== "undefined") patch.imageMediaId = validId(body.imageMediaId) ? body.imageMediaId : null;
    if (typeof body.slug !== "undefined") {
      const normalizedSlug = slugify(body.slug);
      if (!normalizedSlug) return res.status(400).json({ ok: false, message: "slug is required" });
      patch.slug = normalizedSlug;
    }
    if (typeof body.heroHeading !== "undefined") patch.heroHeading = String(body.heroHeading || "").trim();
    if (typeof body.heroSubheading !== "undefined") patch.heroSubheading = String(body.heroSubheading || "").trim();
    if (typeof body.heroImageUrl !== "undefined") patch.heroImageUrl = String(body.heroImageUrl || "").trim();
    if (typeof body.heroImageMediaId !== "undefined") patch.heroImageMediaId = validId(body.heroImageMediaId) ? body.heroImageMediaId : null;
    if (typeof body.heroCtaText !== "undefined") patch.heroCtaText = String(body.heroCtaText || "").trim();
    if (typeof body.heroCtaLink !== "undefined") patch.heroCtaLink = String(body.heroCtaLink || "").trim();
    if (typeof body.blocks !== "undefined") patch.blocks = Array.isArray(body.blocks) ? body.blocks : [];
    if (typeof body.order !== "undefined") patch.order = Number(body.order) || 0;
    if (typeof body.isActive !== "undefined") patch.isActive = Boolean(body.isActive);
    const item = await DigitalService.findByIdAndUpdate(id, patch, { new: true }).lean();
    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    return res.json({ ok: true, item });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ ok: false, message: "Slug already in use" });
    console.error("updateService:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function deleteService(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });
    const item = await DigitalService.findByIdAndDelete(id).lean();
    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteService:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function reorderServices(req, res) {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids)) return res.status(400).json({ ok: false, message: "ids array required" });
    await Promise.all(ids.map((id, idx) => DigitalService.findByIdAndUpdate(id, { order: idx }).lean()));
    return res.json({ ok: true });
  } catch (e) {
    console.error("reorderServices:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// ─── Solutions ────────────────────────────────────────────────────────────────

const SOLUTION_KINDS = ["technology", "digital"];
const CUSTOM_PAGES = ["", "cas"]; // bespoke website pages that exist in code

// ?kind=technology (default) | digital | all
// Legacy documents without a kind are technology solutions.
function kindFilter(kind) {
  const k = String(kind || "technology").toLowerCase();
  if (k === "all") return {};
  if (k === "digital") return { kind: "digital" };
  return { kind: { $ne: "digital" } };
}

function cleanSafeHref(v) {
  const s = String(v || "").trim();
  // internal paths or https links only
  if (!s) return "";
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  if (/^https:\/\//i.test(s)) return s;
  return "";
}

function classificationFields(body, { partial }) {
  const out = {};
  const has = (k) => typeof body[k] !== "undefined";
  if (!partial || has("kind")) {
    const k = String(body.kind || "technology").toLowerCase();
    if (!SOLUTION_KINDS.includes(k)) return { error: "kind must be technology or digital" };
    out.kind = k;
  }
  if (!partial || has("ownership")) {
    const own = String(body.ownership || (out.kind === "digital" ? "expresso" : "partner")).toLowerCase();
    if (!["expresso", "partner"].includes(own)) return { error: "ownership must be expresso or partner" };
    out.ownership = own;
  }
  for (const k of ["tagline", "badge", "ctaLabel", "demoCtaLabel"]) {
    if (!partial || has(k)) out[k] = String(body[k] || "").trim();
  }
  if (!partial || has("demoCtaHref")) out.demoCtaHref = cleanSafeHref(body.demoCtaHref);
  if (!partial || has("customPage")) {
    const cp = String(body.customPage || "").trim().toLowerCase();
    if (!CUSTOM_PAGES.includes(cp)) return { error: `customPage must be one of: ${CUSTOM_PAGES.filter(Boolean).join(", ")}` };
    out.customPage = cp;
  }
  return { value: out };
}

// Technology group rule (Stage 2 + Stage 3 combined):
// - digital solutions never carry a technology group (stored as "");
// - technology solutions use one of the four approved groups; a record
//   without one falls back, on read only, to its legacy slug default
//   (see withTechnologyGroup), so nothing is written just by reading.
// Rejects malformed group input before any database access. A group must be
// a known id (or "" meaning none); anything else is invalid for either kind.
function groupInputError(body) {
  if (typeof body.group === "undefined") return null;
  if (typeof body.group !== "string") return "Invalid technology group";
  const g = body.group.trim();
  if (g && !TECHNOLOGY_GROUP_IDS.includes(g)) return "Invalid technology group";
  return null;
}

function resolveGroup({ kind, body, slug, isCreate, kindChanged }) {
  if (kind === "digital") return { value: "" };
  const provided = typeof body.group !== "undefined";
  const g = provided ? body.group.trim() : "";
  if (isCreate) return { value: g || defaultTechnologyGroup(slug) };
  if (provided) {
    if (!g) return { error: "Choose a technology group" };
    return { value: g };
  }
  // Switched from digital to technology without choosing: use the slug default.
  if (kindChanged) return { value: defaultTechnologyGroup(slug) };
  return { skip: true };
}

export async function listSolutions(req, res) {
  try {
    const { includeInactive, kind } = req.query;
    const filter = kindFilter(kind);
    if (!includeInactive) filter.isActive = true;
    const items = await Solution.find(filter).sort({ order: 1, createdAt: 1 }).lean();
    return res.json({ ok: true, items: items.map(withTechnologyGroup), groups: TECHNOLOGY_GROUPS });
  } catch (e) {
    console.error("listSolutions:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getSolutionBySlug(req, res) {
  try {
    const { slug } = req.params;
    const item = await Solution.findOne({ slug: String(slug).trim() }).lean();
    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    return res.json({ ok: true, item: withTechnologyGroup(item) });
  } catch (e) {
    console.error("getSolutionBySlug:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function createSolution(req, res) {
  try {
    const { title, subtitle, description, slug, icon, heroImageUrl, heroImageMediaId, blocks, order, isActive } = req.body || {};
    if (!String(title || "").trim()) return res.status(400).json({ ok: false, message: "title is required" });
    const normalizedSlug = slugify(slug || title);
    if (!normalizedSlug) return res.status(400).json({ ok: false, message: "slug is required" });
    const groupError = groupInputError(req.body || {});
    if (groupError) return res.status(400).json({ ok: false, message: groupError });
    const cls = classificationFields(req.body || {}, { partial: false });
    if (cls.error) return res.status(400).json({ ok: false, message: cls.error });
    const grp = resolveGroup({ kind: cls.value.kind, body: req.body || {}, slug: normalizedSlug, isCreate: true });
    if (grp.error) return res.status(400).json({ ok: false, message: grp.error });
    const item = await Solution.create({
      ...cls.value,
      title: String(title).trim(),
      subtitle: String(subtitle || "").trim(),
      description: String(description || "").trim(),
      slug: normalizedSlug,
      group: grp.value,
      icon: String(icon || "software").trim(),
      heroImageUrl: String(heroImageUrl || "").trim(),
      heroImageMediaId: validId(heroImageMediaId) ? heroImageMediaId : null,
      blocks: Array.isArray(blocks) ? blocks : [],
      order: typeof order === "number" ? order : Number(order) || 0,
      isActive: isActive !== false,
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
    });
    return res.status(201).json({ ok: true, item: withTechnologyGroup(item) });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ ok: false, message: "Slug already in use" });
    console.error("createSolution:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateSolution(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });
    const body = req.body || {};
    const groupError = groupInputError(body);
    if (groupError) return res.status(400).json({ ok: false, message: groupError });
    const patch = { updatedBy: req.user?.id || null };
    if (typeof body.title !== "undefined") patch.title = String(body.title || "").trim();
    if (typeof body.subtitle !== "undefined") patch.subtitle = String(body.subtitle || "").trim();
    if (typeof body.description !== "undefined") patch.description = String(body.description || "").trim();
    if (typeof body.slug !== "undefined") {
      const normalizedSlug = slugify(body.slug);
      if (!normalizedSlug) return res.status(400).json({ ok: false, message: "slug is required" });
      patch.slug = normalizedSlug;
    }
    if (typeof body.icon !== "undefined") patch.icon = String(body.icon || "").trim();
    if (typeof body.heroImageUrl !== "undefined") patch.heroImageUrl = String(body.heroImageUrl || "").trim();
    if (typeof body.heroImageMediaId !== "undefined") patch.heroImageMediaId = validId(body.heroImageMediaId) ? body.heroImageMediaId : null;
    if (typeof body.blocks !== "undefined") patch.blocks = Array.isArray(body.blocks) ? body.blocks : [];
    if (typeof body.order !== "undefined") patch.order = Number(body.order) || 0;
    if (typeof body.isActive !== "undefined") patch.isActive = Boolean(body.isActive);
    const cls = classificationFields(body, { partial: true });
    if (cls.error) return res.status(400).json({ ok: false, message: cls.error });
    Object.assign(patch, cls.value);

    // The group rule depends on the record's kind, which a partial update may
    // not send, so read the current kind/slug first.
    const current = await Solution.findById(id).select("kind slug").lean();
    if (!current) return res.status(404).json({ ok: false, message: "Not found" });
    const currentKind = current.kind === "digital" ? "digital" : "technology";
    const kind = cls.value.kind || currentKind;
    const grp = resolveGroup({
      kind,
      body,
      slug: patch.slug || current.slug,
      isCreate: false,
      kindChanged: kind !== currentKind,
    });
    if (grp.error) return res.status(400).json({ ok: false, message: grp.error });
    if (!grp.skip) patch.group = grp.value;

    const item = await Solution.findByIdAndUpdate(id, patch, { new: true }).lean();
    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    return res.json({ ok: true, item: withTechnologyGroup(item) });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ ok: false, message: "Slug already in use" });
    console.error("updateSolution:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function deleteSolution(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });
    const item = await Solution.findByIdAndDelete(id).lean();
    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteSolution:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function reorderSolutions(req, res) {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids)) return res.status(400).json({ ok: false, message: "ids array required" });
    await Promise.all(ids.map((id, idx) => Solution.findByIdAndUpdate(id, { order: idx }).lean()));
    return res.json({ ok: true });
  } catch (e) {
    console.error("reorderSolutions:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
