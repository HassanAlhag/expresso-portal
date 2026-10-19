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

export async function listSolutions(req, res) {
  try {
    const { includeInactive } = req.query;
    const filter = {};
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
    const { title, subtitle, description, slug, group, icon, heroImageUrl, heroImageMediaId, blocks, order, isActive } = req.body || {};
    if (!String(title || "").trim()) return res.status(400).json({ ok: false, message: "title is required" });
    const normalizedSlug = slugify(slug || title);
    if (!normalizedSlug) return res.status(400).json({ ok: false, message: "slug is required" });
    if (group !== undefined && group !== "" && !TECHNOLOGY_GROUP_IDS.includes(group)) {
      return res.status(400).json({ ok: false, message: "Invalid technology group" });
    }
    const item = await Solution.create({
      title: String(title).trim(),
      subtitle: String(subtitle || "").trim(),
      description: String(description || "").trim(),
      slug: normalizedSlug,
      group: group || defaultTechnologyGroup(normalizedSlug),
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
    const patch = { updatedBy: req.user?.id || null };
    if (typeof body.group !== "undefined") {
      if (!TECHNOLOGY_GROUP_IDS.includes(body.group)) {
        return res.status(400).json({ ok: false, message: "Invalid technology group" });
      }
      patch.group = body.group;
    }
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
