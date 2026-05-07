import Lead from "../crm/leads/lead.model.js";

export async function submitPlanBuilder(req, res) {
  try {
    const body = req.body || {};

    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const phone = String(body.phone || "").trim();
    const notes = String(body.notes || "").trim();
    const companyName = String(body.companyName || "").trim();

    if (!fullName) {
      return res.status(400).json({
        ok: false,
        message: "fullName is required",
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        ok: false,
        message: "email or phone is required",
      });
    }

    const item = await Lead.create({
      fullName,
      companyName,
      email,
      phone,
      source: "plan_builder",
      status: "new",
      notes,
      ownerUserId: null,
      createdBy: null,
      updatedBy: null,
    });

    return res.status(201).json({
      ok: true,
      message: "Plan submitted successfully",
      item,
    });
  } catch (e) {
    console.error("submitPlanBuilder:", e);
    return res.status(500).json({
      ok: false,
      message: "Server error",
    });
  }
}
