import Career from "./career.model.js";

export async function listPublicCareers(_req, res) {
  try {
    const items = await Career.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();
    res.json({ ok: true, items });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
}

export async function listCareers(_req, res) {
  try {
    const items = await Career.find().sort({ order: 1, createdAt: -1 }).lean();
    res.json({ ok: true, items });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
}

export async function createCareer(req, res) {
  try {
    const item = await Career.create(req.body);
    res.status(201).json({ ok: true, item });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
}

export async function updateCareer(req, res) {
  try {
    const item = await Career.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    res.json({ ok: true, item });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
}

export async function deleteCareer(req, res) {
  try {
    const item = await Career.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
}
