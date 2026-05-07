import mongoose from "mongoose";
import RFQ from "./rfq.model.js";
import Quotation from "./quotation.model.js";
import ProcurementVendor from "./vendor.model.js";
import ProcurementRequest from "./request.model.js";
import { sendMail } from "../../utils/email.js";

function validId(id) {
  return id && mongoose.Types.ObjectId.isValid(id);
}

async function genRfqNumber() {
  const count = await RFQ.countDocuments();
  return `RFQ-${new Date().getFullYear()}-${String(count + 1).padStart(
    4,
    "0"
  )}`;
}

async function getVendorProfile(userId) {
  return ProcurementVendor.findOne({ userId, isActive: true }).lean();
}

// POST /api/procurement/requests/:id/create-rfq
export async function createRfqFromRequest(req, res) {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid request id" });
    }

    const request = await ProcurementRequest.findById(id)
      .populate("categoryId", "name level")
      .lean();

    if (!request) {
      return res
        .status(404)
        .json({ ok: false, message: "Procurement request not found" });
    }

    const existingRfq = await RFQ.findOne({ requestId: request._id }).lean();

    if (existingRfq) {
      return res.status(409).json({
        ok: false,
        message: "An RFQ has already been created from this request.",
        item: existingRfq,
      });
    }

    const subcategoryIds = [];

    if (request.categoryId?._id) {
      subcategoryIds.push(request.categoryId._id);
    }

    if (subcategoryIds.length === 0) {
      return res.status(400).json({
        ok: false,
        message:
          "This request has no category. Please assign a category before creating an RFQ.",
      });
    }

    const rfqNumber = await genRfqNumber();

    const descriptionParts = [
      request.description,
      request.requirements ? `Requirements:\n${request.requirements}` : "",
      request.budget || request.budget === 0
        ? `Estimated Budget: ${request.currency || "AED"} ${request.budget}`
        : "",
    ].filter(Boolean);

    const rfq = await RFQ.create({
      requestId: request._id,
      rfqNumber,
      title: request.title,
      description: descriptionParts.join("\n\n"),
      deadline: request.proposedDelivery || null,
      status: "draft",
      subcategoryIds,
      attachments: [],
      createdBy: req.user?.id || null,
    });

    await ProcurementRequest.findByIdAndUpdate(request._id, {
      status: "assessing",
      updatedBy: req.user?._id || req.user?.id || null,
    });

    return res.status(201).json({
      ok: true,
      item: rfq,
      message: "Draft RFQ created from request.",
    });
  } catch (e) {
    console.error("createRfqFromRequest:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// POST /api/procurement/rfqs
export async function createRfq(req, res) {
  try {
    const body = req.body || {};
    const title = String(body.title || "").trim();
    if (!title) {
      return res.status(400).json({ ok: false, message: "title is required" });
    }

    const subcategoryIds = Array.isArray(body.subcategoryIds)
      ? body.subcategoryIds.filter(validId)
      : [];

    const rfqNumber = await genRfqNumber();

    const doc = await RFQ.create({
      rfqNumber,
      title,
      description: String(body.description || "").trim(),
      deadline: body.deadline || null,
      status: "draft",
      subcategoryIds,
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      createdBy: req.user?.id || null,
    });

    return res.status(201).json({ ok: true, item: doc });
  } catch (e) {
    console.error("createRfq:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// GET /api/procurement/rfqs
export async function listRfqs(req, res) {
  try {
    const { status = "", q = "", page = "1", limit = "20" } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const isVendor = req.user?.role === "vendor";

    let filter = {};

    if (isVendor) {
      const vendor = await getVendorProfile(req.user.id);
      if (!vendor) {
        return res
          .status(403)
          .json({ ok: false, message: "Vendor profile not found" });
      }
      filter = {
        status: "published",
        subcategoryIds: { $in: vendor.categories },
      };
    } else {
      if (status) filter.status = status;
    }

    if (q.trim()) {
      const rx = new RegExp(
        q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      filter.$or = [{ title: rx }, { rfqNumber: rx }, { description: rx }];
    }

    const [total, items] = await Promise.all([
      RFQ.countDocuments(filter),
      RFQ.find(filter)
        .populate("subcategoryIds", "name code")
        .populate("createdBy", "fullName email")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ]);

    // For vendors, attach whether they've submitted a quotation
    if (isVendor) {
      const vendor = await getVendorProfile(req.user.id);
      const rfqIds = items.map((r) => r._id);
      const quotations = await Quotation.find({
        rfqId: { $in: rfqIds },
        vendorId: vendor._id,
      })
        .select("rfqId status")
        .lean();
      const qMap = {};
      quotations.forEach((q) => {
        qMap[String(q.rfqId)] = q.status;
      });
      items.forEach((r) => {
        r.myQuotationStatus = qMap[String(r._id)] || null;
      });
    }

    return res.json({
      ok: true,
      items,
      total,
      page: pageNum,
      pages: Math.max(1, Math.ceil(total / limitNum)),
      limit: limitNum,
    });
  } catch (e) {
    console.error("listRfqs:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// GET /api/procurement/rfqs/:id
export async function getRfq(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const item = await RFQ.findById(id)
      .populate("subcategoryIds", "name code")
      .populate("createdBy", "fullName email")
      .lean();

    if (!item)
      return res.status(404).json({ ok: false, message: "RFQ not found" });

    if (req.user?.role === "vendor") {
      if (
        item.status !== "published" &&
        item.status !== "closed" &&
        item.status !== "awarded"
      ) {
        return res
          .status(403)
          .json({ ok: false, message: "RFQ not available" });
      }
      const vendor = await getVendorProfile(req.user.id);
      if (!vendor)
        return res
          .status(403)
          .json({ ok: false, message: "Vendor profile not found" });

      const vendorCats = vendor.categories.map(String);
      const rfqCats = item.subcategoryIds.map((c) => String(c._id || c));
      const matched = rfqCats.some((c) => vendorCats.includes(c));
      if (!matched)
        return res
          .status(403)
          .json({ ok: false, message: "RFQ not in your categories" });

      const myQuotation = await Quotation.findOne({
        rfqId: item._id,
        vendorId: vendor._id,
      }).lean();
      item.myQuotation = myQuotation || null;
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("getRfq:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// PATCH /api/procurement/rfqs/:id
export async function updateRfq(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const item = await RFQ.findById(id);
    if (!item)
      return res.status(404).json({ ok: false, message: "RFQ not found" });
    if (item.status !== "draft") {
      return res
        .status(400)
        .json({ ok: false, message: "Only draft RFQs can be edited" });
    }

    const body = req.body || {};
    if (body.title !== undefined) item.title = String(body.title).trim();
    if (body.description !== undefined)
      item.description = String(body.description).trim();
    if (body.deadline !== undefined) item.deadline = body.deadline || null;
    if (Array.isArray(body.subcategoryIds)) {
      item.subcategoryIds = body.subcategoryIds.filter(validId);
    }
    if (Array.isArray(body.attachments)) item.attachments = body.attachments;

    await item.save();
    return res.json({ ok: true, item });
  } catch (e) {
    console.error("updateRfq:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// PATCH /api/procurement/rfqs/:id/publish
export async function publishRfq(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const item = await RFQ.findById(id).populate("subcategoryIds", "name code");
    if (!item)
      return res.status(404).json({ ok: false, message: "RFQ not found" });
    if (item.status !== "draft") {
      return res
        .status(400)
        .json({ ok: false, message: "RFQ is already published" });
    }

    item.status = "published";
    item.publishedAt = new Date();
    await item.save();

    let notified = 0;
    if (req.body?.notifyVendors === true) {
      const vendors = await ProcurementVendor.find({
        categories: { $in: item.subcategoryIds.map((c) => c._id || c) },
        isActive: true,
        email: { $ne: "" },
      })
        .select("email contactPerson name")
        .lean();

      const catNames = item.subcategoryIds.map((c) => c.name).join(", ");
      const deadline = item.deadline
        ? new Date(item.deadline).toLocaleDateString("en-GB")
        : "Open";

      await Promise.allSettled(
        vendors.map((v) =>
          sendMail({
            to: v.email,
            subject: `New RFQ: ${item.title} [${item.rfqNumber}]`,
            html: `
              <p>Dear ${v.contactPerson || v.name},</p>
              <p>A new Request for Quotation matching your registered categories has been published.</p>
              <table style="border-collapse:collapse;margin:16px 0">
                <tr><td style="padding:4px 12px 4px 0;color:#666">RFQ Number</td><td><strong>${
                  item.rfqNumber
                }</strong></td></tr>
                <tr><td style="padding:4px 12px 4px 0;color:#666">Title</td><td>${
                  item.title
                }</td></tr>
                <tr><td style="padding:4px 12px 4px 0;color:#666">Categories</td><td>${catNames}</td></tr>
                <tr><td style="padding:4px 12px 4px 0;color:#666">Deadline</td><td>${deadline}</td></tr>
              </table>
              <p>Log in to your vendor dashboard to review and submit your quotation.</p>
            `,
          })
        )
      );
      notified = vendors.length;
    }

    return res.json({ ok: true, item, notified });
  } catch (e) {
    console.error("publishRfq:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// PATCH /api/procurement/rfqs/:id/close
export async function closeRfq(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const item = await RFQ.findById(id);
    if (!item)
      return res.status(404).json({ ok: false, message: "RFQ not found" });
    if (item.status === "closed" || item.status === "awarded") {
      return res.status(400).json({ ok: false, message: "RFQ already closed" });
    }

    item.status = "closed";
    item.closedAt = new Date();
    await item.save();

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("closeRfq:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// GET /api/procurement/rfqs/:id/quotations
export async function listQuotations(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const isVendor = req.user?.role === "vendor";

    let filter = { rfqId: id };

    if (isVendor) {
      const vendor = await getVendorProfile(req.user.id);
      if (!vendor)
        return res
          .status(403)
          .json({ ok: false, message: "Vendor profile not found" });
      filter.vendorId = vendor._id;
    }

    const items = await Quotation.find(filter)
      .populate("vendorId", "name email contactPerson")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ ok: true, items });
  } catch (e) {
    console.error("listQuotations:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// POST /api/procurement/rfqs/:id/quotations
export async function submitQuotation(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const rfq = await RFQ.findById(id);
    if (!rfq)
      return res.status(404).json({ ok: false, message: "RFQ not found" });
    if (rfq.status !== "published") {
      return res
        .status(400)
        .json({ ok: false, message: "RFQ is not accepting quotations" });
    }

    const vendor = await getVendorProfile(req.user.id);
    if (!vendor)
      return res
        .status(403)
        .json({ ok: false, message: "Vendor profile not found" });

    // Check vendor is matched
    const vendorCats = vendor.categories.map(String);
    const rfqCats = rfq.subcategoryIds.map(String);
    if (!rfqCats.some((c) => vendorCats.includes(c))) {
      return res
        .status(403)
        .json({ ok: false, message: "This RFQ is not in your categories" });
    }

    const body = req.body || {};
    const price = Number(body.price);
    if (!price || price <= 0) {
      return res
        .status(400)
        .json({ ok: false, message: "price is required and must be positive" });
    }

    // Upsert — allow re-submit if rejected
    const existing = await Quotation.findOne({
      rfqId: id,
      vendorId: vendor._id,
    });
    if (existing && existing.status !== "rejected") {
      return res.status(409).json({
        ok: false,
        message: "You have already submitted a quotation for this RFQ",
      });
    }

    const doc = await Quotation.findOneAndUpdate(
      { rfqId: id, vendorId: vendor._id },
      {
        price,
        currency: String(body.currency || "AED").trim(),
        deliveryDays: body.deliveryDays ? Number(body.deliveryDays) : null,
        notes: String(body.notes || "").trim(),
        attachments: Array.isArray(body.attachments) ? body.attachments : [],
        status: "submitted",
        submittedAt: new Date(),
      },
      { new: true, upsert: true }
    );

    return res.status(201).json({ ok: true, item: doc });
  } catch (e) {
    console.error("submitQuotation:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// PATCH /api/procurement/quotations/:quotationId/status
export async function updateQuotationStatus(req, res) {
  try {
    const { quotationId } = req.params;
    if (!validId(quotationId))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const allowed = ["under_review", "accepted", "rejected"];
    const status = req.body?.status;
    if (!allowed.includes(status)) {
      return res.status(400).json({
        ok: false,
        message: `status must be one of: ${allowed.join(", ")}`,
      });
    }

    const doc = await Quotation.findByIdAndUpdate(
      quotationId,
      { status },
      { new: true }
    ).populate("vendorId", "name email");

    if (!doc)
      return res
        .status(404)
        .json({ ok: false, message: "Quotation not found" });

    // If awarded, close the RFQ
    if (status === "accepted") {
      await RFQ.findByIdAndUpdate(doc.rfqId, { status: "awarded" });
    }

    return res.json({ ok: true, item: doc });
  } catch (e) {
    console.error("updateQuotationStatus:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// GET /api/procurement/rfqs/:id/matched-vendors  (staff preview)
export async function getMatchedVendors(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const rfq = await RFQ.findById(id).lean();
    if (!rfq)
      return res.status(404).json({ ok: false, message: "RFQ not found" });

    const vendors = await ProcurementVendor.find({
      categories: { $in: rfq.subcategoryIds },
      isActive: true,
    })
      .select("name email contactPerson country")
      .lean();

    return res.json({ ok: true, items: vendors, total: vendors.length });
  } catch (e) {
    console.error("getMatchedVendors:", e);
    return res.status(500).json({ ok: false, message: e.message });
  }
}
