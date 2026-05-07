import mongoose from "mongoose";
import Deal from "./deal.model.js";
import Account from "../accounts/account.model.js";
import Lead from "../leads/lead.model.js";
import Contact from "../contacts/contact.model.js";
import { normalizeDealStage, safeDealSort } from "./deal.constants.js";
import Customer from "../../customers/customer.model.js";
import Enrollment from "../../enrollments/enrollment.model.js";

function validId(id) {
  return id && mongoose.Types.ObjectId.isValid(id);
}

function safeRx(s) {
  const v = String(s || "").trim();
  if (!v) return null;
  return new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

function stageToStatus(stage) {
  if (stage === "won") return "won";
  if (stage === "lost") return "lost";
  return "open";
}

export async function convertDealToCustomer(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid deal id" });
    }

    const deal = await Deal.findById(id)
      .populate("accountId")
      .populate("leadId")
      .lean();

    if (!deal) {
      return res.status(404).json({ ok: false, message: "Deal not found" });
    }

    const companyName =
      deal.accountId?.name ||
      deal.companyName ||
      deal.leadId?.companyName ||
      deal.title ||
      "New Client";

    const contactName =
      deal.contactName ||
      deal.leadId?.fullName ||
      deal.accountId?.contactName ||
      "Client Contact";

    const primaryEmail =
      deal.email || deal.leadId?.email || deal.accountId?.email || "";

    const phone =
      deal.phone || deal.leadId?.phone || deal.accountId?.phone || "";

    const existingCustomer = await Customer.findOne({
      $or: [
        primaryEmail ? { primaryEmail } : null,
        companyName ? { companyName } : null,
      ].filter(Boolean),
    }).lean();

    let crmAccountId = deal.accountId?._id || null;
    const crmDealId = deal._id;

    // Auto-create a CRM Account if the deal has none
    if (!crmAccountId && companyName) {
      const newAcct = await Account.create({
        name: companyName,
        email: primaryEmail || "",
        phone: phone || "",
        industry: deal.industry || "",
        country: deal.country || "",
        status: "active",
        ownerUserId: req.user?.id || null,
        createdBy: req.user?.id || null,
        updatedBy: req.user?.id || null,
      });
      crmAccountId = newAcct._id;
    }

    let customer = existingCustomer;

    if (!customer) {
      customer = await Customer.create({
        companyName,
        contactName,
        primaryEmail,
        phone,
        industry: deal.industry || "",
        country: deal.country || "",
        notes: deal.notes || "",
        isActive: true,
        crmAccountId,
        crmDealId,
        createdBy: req.user?.id || null,
        updatedBy: req.user?.id || null,
      });
    } else {
      customer = await Customer.findByIdAndUpdate(
        customer._id,
        {
          crmAccountId: customer.crmAccountId || crmAccountId,
          crmDealId: customer.crmDealId || crmDealId,
          updatedBy: req.user?.id || null,
        },
        { new: true }
      );
    }

    await Deal.findByIdAndUpdate(id, {
      stage: "won",
      customerId: customer._id,
      convertedAt: new Date(),
      updatedBy: req.user?.id || null,
    });

    if (crmAccountId) {
      await Account.findByIdAndUpdate(crmAccountId, {
        customerId: customer._id,
        updatedBy: req.user?.id || null,
      });
    }

    // Auto-create primary CRM Contact if none exists for this customer
    const existingContact = await Contact.findOne({ customerId: customer._id }).lean();
    if (!existingContact && contactName) {
      await Contact.create({
        fullName: contactName,
        email: primaryEmail || "",
        phone: phone || "",
        accountId: crmAccountId || null,
        customerId: customer._id,
        isPrimary: true,
        source: "deal_converted",
        createdBy: req.user?.id || null,
        updatedBy: req.user?.id || null,
      });
    }

    return res.json({
      ok: true,
      message: "Deal converted to customer",
      customer,
    });
  } catch (e) {
    console.error("convertDealToCustomer:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function listDeals(req, res) {
  try {
    const {
      q = "",
      stage = "",
      status = "",
      pipeline = "",
      ownerUserId = "",
      page = "1",
      limit = "20",
      sort = "-createdAt",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const filter = {};

    if (stage) filter.stage = normalizeDealStage(stage);
    if (status) filter.status = String(status).trim().toLowerCase();
    if (pipeline) filter.pipeline = String(pipeline).trim().toLowerCase();
    if (validId(ownerUserId)) filter.ownerUserId = ownerUserId;

    const rx = safeRx(q);
    if (rx) {
      filter.$or = [{ title: rx }, { notes: rx }, { source: rx }, { tags: rx }];
    }

    const [total, items] = await Promise.all([
      Deal.countDocuments(filter),
      Deal.find(filter)
        .populate("ownerUserId", "fullName email role")
        .populate("customerId", "companyName contactName")
        .sort(safeDealSort(sort))
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ]);

    return res.json({
      ok: true,
      items,
      page: pageNum,
      pages: Math.max(1, Math.ceil(total / limitNum)),
      total,
      limit: limitNum,
    });
  } catch (e) {
    console.error("listDeals:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function getDeal(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await Deal.findById(id)
      .populate("ownerUserId", "fullName email role")
      .populate("customerId", "companyName contactName primaryEmail phone")
      .lean();

    if (!item) {
      return res.status(404).json({ ok: false, message: "Deal not found" });
    }

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("getDeal:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function createDeal(req, res) {
  try {
    const body = req.body || {};

    const title = String(body.title || "").trim();
    if (!title) {
      return res.status(400).json({ ok: false, message: "Title is required" });
    }

    const stage = normalizeDealStage(body.stage);
    const status = stageToStatus(stage);

    const item = await Deal.create({
      title,
      pipeline: String(body.pipeline || "sales")
        .trim()
        .toLowerCase(),
      stage,
      status,
      accountId: validId(body.accountId) ? body.accountId : null,
      contactId: validId(body.contactId) ? body.contactId : null,
      leadId: validId(body.leadId) ? body.leadId : null,
      customerId: validId(body.customerId) ? body.customerId : null,
      ownerUserId: validId(body.ownerUserId)
        ? body.ownerUserId
        : req.user?.id || null,
      value:
        body.value === "" || body.value === null || body.value === undefined
          ? null
          : Number(body.value),
      currency: String(body.currency || "AED")
        .trim()
        .toUpperCase(),
      probability: Math.max(0, Math.min(100, Number(body.probability || 0))),
      expectedCloseDate: body.expectedCloseDate || null,
      source: String(body.source || "").trim(),
      tags: Array.isArray(body.tags) ? body.tags : [],
      notes: String(body.notes || "").trim(),
      wonAt: stage === "won" ? new Date() : null,
      lostAt: stage === "lost" ? new Date() : null,
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
    });

    return res.status(201).json({ ok: true, item });
  } catch (e) {
    console.error("createDeal:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function updateDeal(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const current = await Deal.findById(id).lean();
    if (!current) {
      return res.status(404).json({ ok: false, message: "Deal not found" });
    }

    const body = req.body || {};
    const patch = {
      updatedBy: req.user?.id || null,
    };

    if (typeof body.title !== "undefined") {
      patch.title = String(body.title || "").trim();
    }

    if (typeof body.pipeline !== "undefined") {
      patch.pipeline = String(body.pipeline || "sales")
        .trim()
        .toLowerCase();
    }

    if (typeof body.stage !== "undefined") {
      const stage = normalizeDealStage(body.stage);
      patch.stage = stage;
      patch.status = stageToStatus(stage);
      if (stage === "won" && !current.wonAt) patch.wonAt = new Date();
      if (stage === "lost" && !current.lostAt) patch.lostAt = new Date();
    }

    if (typeof body.accountId !== "undefined") {
      patch.accountId = validId(body.accountId) ? body.accountId : null;
    }

    if (typeof body.contactId !== "undefined") {
      patch.contactId = validId(body.contactId) ? body.contactId : null;
    }

    if (typeof body.leadId !== "undefined") {
      patch.leadId = validId(body.leadId) ? body.leadId : null;
    }

    if (typeof body.customerId !== "undefined") {
      patch.customerId = validId(body.customerId) ? body.customerId : null;
    }

    if (typeof body.ownerUserId !== "undefined") {
      patch.ownerUserId = validId(body.ownerUserId) ? body.ownerUserId : null;
    }

    if (typeof body.value !== "undefined") {
      patch.value =
        body.value === "" || body.value === null ? null : Number(body.value);
    }

    if (typeof body.currency !== "undefined") {
      patch.currency = String(body.currency || "AED")
        .trim()
        .toUpperCase();
    }

    if (typeof body.probability !== "undefined") {
      patch.probability = Math.max(
        0,
        Math.min(100, Number(body.probability || 0))
      );
    }

    if (typeof body.expectedCloseDate !== "undefined") {
      patch.expectedCloseDate = body.expectedCloseDate || null;
    }

    if (typeof body.source !== "undefined") {
      patch.source = String(body.source || "").trim();
    }

    if (typeof body.tags !== "undefined") {
      patch.tags = Array.isArray(body.tags) ? body.tags : [];
    }

    if (typeof body.notes !== "undefined") {
      patch.notes = String(body.notes || "").trim();
    }

    const item = await Deal.findByIdAndUpdate(id, patch, { new: true })
      .populate("ownerUserId", "fullName email role")
      .populate("customerId", "companyName contactName")
      .lean();

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("updateDeal:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

export async function deleteDeal(req, res) {
  try {
    const { id } = req.params;
    if (!validId(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const item = await Deal.findByIdAndDelete(id).lean();
    if (!item) {
      return res.status(404).json({ ok: false, message: "Deal not found" });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteDeal:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
