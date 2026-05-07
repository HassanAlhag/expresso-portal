import mongoose from "mongoose";
import crypto from "crypto";
import VendorApplication from "./vendor-application.model.js";
import ProcurementVendor from "./vendor.model.js";
import User from "../iam/users/user.model.js";

function validId(id) {
  return id && mongoose.Types.ObjectId.isValid(id);
}

function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function genPassword(len = 12) {
  return crypto.randomBytes(len).toString("base64").slice(0, len);
}

const POPULATE_SELECTIONS = [
  { path: "categorySelections.mainCategoryId", select: "name code" },
  { path: "categorySelections.categoryId", select: "name code" },
  { path: "categorySelections.subcategoryId", select: "name code" },
];

// POST /api/vendor-applications  — public, no auth
export async function registerVendorApplication(req, res) {
  try {
    const body = req.body || {};

    const companyName = String(body.companyName || "").trim();
    const contactName = String(body.contactName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();

    if (!companyName || !contactName || !email) {
      return res.status(400).json({
        ok: false,
        message: "companyName, contactName, and email are required",
      });
    }

    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(email)) {
      return res.status(400).json({ ok: false, message: "Invalid email address" });
    }

    const existing = await VendorApplication.findOne({ email, status: { $ne: "rejected" } }).lean();
    if (existing) {
      return res.status(409).json({
        ok: false,
        message: "An application with this email already exists",
      });
    }

    const selections = Array.isArray(body.categorySelections) ? body.categorySelections : [];
    if (selections.length < 1 || selections.length > 3) {
      return res.status(400).json({
        ok: false,
        message: "Select between 1 and 3 categories",
      });
    }

    for (const sel of selections) {
      if (!validId(sel.mainCategoryId) || !validId(sel.categoryId) || !validId(sel.subcategoryId)) {
        return res.status(400).json({
          ok: false,
          message: "Each category selection must include valid mainCategoryId, categoryId, and subcategoryId",
        });
      }
    }

    const doc = await VendorApplication.create({
      companyName,
      contactName,
      email,
      phone: String(body.phone || "").trim(),
      country: String(body.country || "UAE").trim(),
      website: String(body.website || "").trim(),
      categorySelections: selections,
      status: "pending",
    });

    return res.status(201).json({ ok: true, item: doc });
  } catch (e) {
    console.error("registerVendorApplication:", e);
    return res.status(500).json({ ok: false, message: e.message || "Server error" });
  }
}

// GET /api/vendor-applications  — admin/staff
export async function listVendorApplications(req, res) {
  try {
    const {
      status = "",
      q = "",
      page = "1",
      limit = "20",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const filter = {};
    if (status) filter.status = status;

    if (q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [
        { companyName: rx },
        { contactName: rx },
        { email: rx },
        { country: rx },
      ];
    }

    const [total, items] = await Promise.all([
      VendorApplication.countDocuments(filter),
      VendorApplication.find(filter)
        .populate(POPULATE_SELECTIONS)
        .populate("approvedBy", "fullName email")
        .populate("userId", "fullName email")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ]);

    return res.json({
      ok: true,
      items,
      total,
      page: pageNum,
      pages: Math.max(1, Math.ceil(total / limitNum)),
      limit: limitNum,
    });
  } catch (e) {
    console.error("listVendorApplications:", e);
    return res.status(500).json({ ok: false, message: e.message || "Server error" });
  }
}

// GET /api/vendor-applications/:id  — admin/staff
export async function getVendorApplication(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });

    const item = await VendorApplication.findById(id)
      .populate(POPULATE_SELECTIONS)
      .populate("approvedBy", "fullName email")
      .populate("userId", "fullName email")
      .lean();

    if (!item) return res.status(404).json({ ok: false, message: "Application not found" });
    return res.json({ ok: true, item });
  } catch (e) {
    console.error("getVendorApplication:", e);
    return res.status(500).json({ ok: false, message: e.message || "Server error" });
  }
}

// PATCH /api/vendor-applications/:id/approve  — admin
export async function approveVendorApplication(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });

    const application = await VendorApplication.findById(id);
    if (!application) return res.status(404).json({ ok: false, message: "Application not found" });

    if (application.status === "approved") {
      return res.status(409).json({ ok: false, message: "Application already approved" });
    }

    // Check if user already exists for this email
    const existingUser = await User.findOne({ email: application.email }).lean();
    if (existingUser) {
      return res.status(409).json({
        ok: false,
        message: `A portal user already exists for ${application.email}`,
      });
    }

    // Generate temp password and create User
    const tempPassword = genPassword(12);
    const passwordHash = await User.hashPassword(tempPassword);

    const user = await User.create({
      fullName: application.contactName,
      email: application.email,
      role: "vendor",
      isActive: true,
      phone: application.phone || "",
      passwordHash,
      passwordChangedAt: new Date(),
    });

    // Collect all subcategory IDs for the vendor profile
    const categoryIds = application.categorySelections.map((s) => s.subcategoryId);

    // Create Vendor profile
    const vendor = await ProcurementVendor.create({
      name: application.companyName,
      email: application.email,
      phone: application.phone || "",
      contactPerson: application.contactName,
      country: application.country || "UAE",
      website: application.website || "",
      categories: categoryIds,
      applicationId: application._id,
      userId: user._id,
      isActive: true,
    });

    // Update application
    application.status = "approved";
    application.approvedBy = req.user?.id || null;
    application.approvedAt = new Date();
    application.userId = user._id;
    application.vendorId = vendor._id;
    await application.save();

    return res.json({
      ok: true,
      item: application,
      credentials: {
        email: user.email,
        tempPassword,
        note: "Share these credentials with the vendor. They should change their password on first login.",
      },
      vendor: {
        _id: vendor._id,
        name: vendor.name,
      },
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    console.error("approveVendorApplication:", e);
    return res.status(500).json({ ok: false, message: e.message || "Server error" });
  }
}

// PATCH /api/vendor-applications/:id/reject  — admin
export async function rejectVendorApplication(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ ok: false, message: "Invalid id" });

    const application = await VendorApplication.findById(id);
    if (!application) return res.status(404).json({ ok: false, message: "Application not found" });

    if (application.status === "approved") {
      return res.status(409).json({ ok: false, message: "Cannot reject an already approved application" });
    }

    application.status = "rejected";
    application.rejectionReason = String(req.body?.reason || "").trim();
    await application.save();

    return res.json({ ok: true, item: application });
  } catch (e) {
    console.error("rejectVendorApplication:", e);
    return res.status(500).json({ ok: false, message: e.message || "Server error" });
  }
}
