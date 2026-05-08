import Template from "./template.model.js";

export async function listTemplates(req, res) {
  try {
    const items = await Template.find()
      .sort({ name: 1 })
      .lean();
    return res.json({ ok: true, items });
  } catch (e) {
    console.error("listTemplates:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function createTemplate(req, res) {
  try {
    const body = req.body || {};
    const name = String(body.name || "").trim();
    if (!name) return res.status(400).json({ ok: false, message: "Name is required" });

    const item = await Template.create({
      name,
      period: String(body.period || "").trim(),
      notes: String(body.notes || "").trim(),
      defaultRating: body.defaultRating ? Math.min(5, Math.max(1, Number(body.defaultRating))) : 3,
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
    });

    return res.status(201).json({ ok: true, item: item.toObject() });
  } catch (e) {
    console.error("createTemplate:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateTemplate(req, res) {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const patch = { updatedBy: req.user?.id || null };

    if (typeof body.name !== "undefined") patch.name = String(body.name || "").trim();
    if (typeof body.period !== "undefined") patch.period = String(body.period || "").trim();
    if (typeof body.notes !== "undefined") patch.notes = String(body.notes || "").trim();
    if (typeof body.defaultRating !== "undefined")
      patch.defaultRating = Math.min(5, Math.max(1, Number(body.defaultRating) || 3));

    const item = await Template.findByIdAndUpdate(id, patch, { new: true }).lean();
    if (!item) return res.status(404).json({ ok: false, message: "Template not found" });

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("updateTemplate:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function deleteTemplate(req, res) {
  try {
    const { id } = req.params;
    const item = await Template.findByIdAndDelete(id).lean();
    if (!item) return res.status(404).json({ ok: false, message: "Template not found" });
    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteTemplate:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
