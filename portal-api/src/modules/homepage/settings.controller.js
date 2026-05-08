import SiteSettings from "./settings.model.js";

const SINGLETON_ID = "site";

async function getOrCreate() {
  let doc = await SiteSettings.findById(SINGLETON_ID).lean();
  if (!doc) {
    doc = await SiteSettings.create({ _id: SINGLETON_ID });
    doc = doc.toObject();
  }
  return doc;
}

// GET /api/site-settings/public  (no auth)
export async function getPublicSettings(req, res) {
  try {
    const doc = await getOrCreate();
    res.json({ ok: true, settings: doc });
  } catch (e) {
    console.error("getPublicSettings:", e);
    res.status(500).json({ ok: false, message: "Server error" });
  }
}

// GET /api/site-settings  (admin)
export async function getSettings(req, res) {
  try {
    const doc = await getOrCreate();
    res.json({ ok: true, settings: doc });
  } catch (e) {
    console.error("getSettings:", e);
    res.status(500).json({ ok: false, message: "Server error" });
  }
}

// PATCH /api/site-settings  (admin)
// Body: { section: "branding"|"home"|"about"|"services"|"portfolio"|"careers"|"contact", data: {...} }
export async function updateSettings(req, res) {
  try {
    const SECTIONS = ["branding", "home", "about", "services", "portfolio", "careers", "contact", "gallery", "marquee"];
    const { section, data } = req.body || {};

    if (!section || !SECTIONS.includes(section)) {
      return res.status(400).json({ ok: false, message: "Invalid section" });
    }
    if (!data || typeof data !== "object") {
      return res.status(400).json({ ok: false, message: "data is required" });
    }

    // Build dot-notation update to only overwrite the given section's fields
    const update = {};
    for (const [k, v] of Object.entries(data)) {
      update[`${section}.${k}`] = v ?? null;
    }

    const doc = await SiteSettings.findByIdAndUpdate(
      SINGLETON_ID,
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    res.json({ ok: true, settings: doc });
  } catch (e) {
    console.error("updateSettings:", e);
    res.status(500).json({ ok: false, message: "Server error" });
  }
}
