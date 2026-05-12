import mongoose from "mongoose";
import Customer from "./customer.model.js";
import User from "../iam/users/user.model.js";
import CRMAccount from "../crm/accounts/account.model.js";
import CRMContact from "../crm/contacts/contact.model.js";
import {
  canSeeAllTenantRecords,
  getUserClientId,
  requireOwnClient,
} from "../../utils/accessControl.js";

function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugify(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function safeSort(sort) {
  const raw = String(sort || "-createdAt");
  const allowed = new Set([
    "createdAt",
    "-createdAt",
    "updatedAt",
    "-updatedAt",
    "companyName",
    "-companyName",
    "contactName",
    "-contactName",
    "primaryEmail",
    "-primaryEmail",
    "isActive",
    "-isActive",
  ]);
  if (!allowed.has(raw)) return { createdAt: -1 };
  const key = raw.startsWith("-") ? raw.slice(1) : raw;
  const dir = raw.startsWith("-") ? -1 : 1;
  return { [key]: dir };
}

// GET /api/customers
export async function listCustomers(req, res) {
  try {
    const {
      q = "",
      isActive = "",
      department = "",
      page = "1",
      limit = "12",
      sort = "-createdAt",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));

    const filter = {};
    if (!canSeeAllTenantRecords(req)) {
      const clientId = getUserClientId(req);
      if (!clientId) {
        return res.json({
          ok: true,
          items: [],
          page: 1,
          pages: 1,
          total: 0,
          limit: limitNum,
        });
      }
      filter._id = clientId;
    }

    if (isActive !== "") filter.isActive = String(isActive) === "true";
    if (["digital_agency", "procurement", "both"].includes(department))
      filter.department = department;

    if (q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [
        { companyName: rx },
        { contactName: rx },
        { slug: rx },
        { primaryEmail: rx },
        { phone: rx },
        { industry: rx },
        { country: rx },
        { code: rx },
      ];
    }

    const [total, items] = await Promise.all([
      Customer.countDocuments(filter),
      Customer.find(filter)
        .sort(safeSort(sort))
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .select(
          "companyName contactName slug primaryEmail phone industry country code isActive ownerUserId logoUrl logoMediaId notes department createdAt updatedAt"
        )
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
    console.error("listCustomers:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// GET /api/customers/:id
export async function getCustomerById(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const item = await Customer.findById(id)
      .select(
        "companyName contactName slug primaryEmail phone industry country code isActive ownerUserId logoUrl logoMediaId notes department crmAccountId crmDealId createdAt updatedAt"
      )
      .populate("crmAccountId", "name industry")
      .populate("crmDealId", "title stage value currency")
      .lean();

    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    if (!requireOwnClient(req, item._id)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }
    return res.json({ ok: true, item });
  } catch (e) {
    console.error("getCustomerById:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// POST /api/customers
export async function createCustomer(req, res) {
  try {
    const body = req.body || {};
    const companyName = String(body.companyName || "").trim();
    const contactName = String(body.contactName || "").trim();

    if (!companyName || !contactName) {
      return res.status(400).json({
        ok: false,
        message: "companyName and contactName are required",
      });
    }

    const finalSlug = body.slug ? slugify(body.slug) : slugify(companyName);
    if (!finalSlug)
      return res.status(400).json({ ok: false, message: "Invalid slug" });

    const exists = await Customer.findOne({ slug: finalSlug }).lean();
    if (exists)
      return res
        .status(409)
        .json({ ok: false, message: "Slug already exists" });

    const doc = await Customer.create({
      companyName,
      contactName,
      slug: finalSlug,
      primaryEmail: String(body.primaryEmail || "")
        .trim()
        .toLowerCase(),
      phone: String(body.phone || "").trim(),
      industry: String(body.industry || "").trim(),
      country: String(body.country || "").trim(),
      code: String(body.code || "").trim() || undefined,
      notes: String(body.notes || "").trim(),
      logoUrl: String(body.logoUrl || "").trim(),
      logoMediaId:
        body.logoMediaId && mongoose.Types.ObjectId.isValid(body.logoMediaId)
          ? body.logoMediaId
          : null,
      isActive: body.isActive !== false,
      department: ["digital_agency", "procurement", "both"].includes(body.department) ? body.department : "digital_agency",
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
    });

    // Auto-create CRM Account + primary Contact (fire-and-forget, don't block response)
    setImmediate(async () => {
      try {
        let accountId = null;
        const existing = await CRMAccount.findOne({ customerId: doc._id }).lean();
        if (!existing) {
          const acct = await CRMAccount.create({
            name: doc.companyName,
            industry: doc.industry || "",
            email: doc.primaryEmail || "",
            phone: doc.phone || "",
            country: doc.country || "",
            status: "active",
            customerId: doc._id,
            ownerUserId: req.user?.id || null,
            createdBy: req.user?.id || null,
            updatedBy: req.user?.id || null,
          });
          accountId = acct._id;
          await Customer.findByIdAndUpdate(doc._id, { crmAccountId: acct._id });
        }

        if (doc.contactName) {
          const existingContact = await CRMContact.findOne({ customerId: doc._id }).lean();
          if (!existingContact) {
            await CRMContact.create({
              fullName: doc.contactName,
              email: doc.primaryEmail || "",
              phone: doc.phone || "",
              accountId: accountId || null,
              customerId: doc._id,
              isPrimary: true,
              source: "client_created",
              createdBy: req.user?.id || null,
              updatedBy: req.user?.id || null,
            });
          }
        }
      } catch (err) {
        console.error("auto-create CRM account/contact:", err);
      }
    });

    return res.status(201).json({ ok: true, item: doc });
  } catch (e) {
    console.error("createCustomer:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// PATCH /api/customers/:id
export async function updateCustomer(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const body = req.body || {};
    const patch = { updatedBy: req.user?.id || null };

    if (typeof body.companyName !== "undefined")
      patch.companyName = String(body.companyName || "").trim();

    if (typeof body.contactName !== "undefined")
      patch.contactName = String(body.contactName || "").trim();

    if (typeof body.primaryEmail !== "undefined")
      patch.primaryEmail = String(body.primaryEmail || "")
        .trim()
        .toLowerCase();

    if (typeof body.phone !== "undefined")
      patch.phone = String(body.phone || "").trim();

    if (typeof body.industry !== "undefined")
      patch.industry = String(body.industry || "").trim();

    if (typeof body.country !== "undefined")
      patch.country = String(body.country || "").trim();

    if (typeof body.code !== "undefined")
      patch.code = String(body.code || "").trim() || undefined;

    if (typeof body.notes !== "undefined")
      patch.notes = String(body.notes || "").trim();

    if (typeof body.logoUrl !== "undefined")
      patch.logoUrl = String(body.logoUrl || "").trim();

    if (typeof body.logoMediaId !== "undefined") {
      patch.logoMediaId =
        body.logoMediaId && mongoose.Types.ObjectId.isValid(body.logoMediaId)
          ? body.logoMediaId
          : null;
    }

    if (typeof body.isActive !== "undefined")
      patch.isActive = Boolean(body.isActive);

    if (typeof body.department !== "undefined" && ["digital_agency", "procurement", "both"].includes(body.department))
      patch.department = body.department;

    if (typeof body.slug !== "undefined") {
      const cleanSlug = slugify(body.slug);
      if (!cleanSlug)
        return res
          .status(400)
          .json({ ok: false, message: "Slug cannot be empty" });

      const dupe = await Customer.findOne({
        slug: cleanSlug,
        _id: { $ne: id },
      }).lean();
      if (dupe)
        return res
          .status(409)
          .json({ ok: false, message: "Slug already exists" });

      patch.slug = cleanSlug;
    }

    const item = await Customer.findByIdAndUpdate(id, patch, {
      new: true,
    }).lean();
    if (!item) return res.status(404).json({ ok: false, message: "Not found" });

    return res.json({ ok: true, item });
  } catch (e) {
    console.error("updateCustomer:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

// DELETE /api/customers/:id (soft delete)
export async function deleteCustomer(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const item = await Customer.findByIdAndUpdate(
      id,
      { isActive: false, updatedBy: req.user?.id || null },
      { new: true }
    ).lean();

    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    return res.json({ ok: true, item });
  } catch (e) {
    console.error("deleteCustomer:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

/**
 * POST /api/customers/:id/create-login
 * body: { email, fullName?, tempPassword }
 */
export async function createCustomerLogin(req, res) {
  try {
    const { id } = req.params;
    const { email, fullName, tempPassword } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ ok: false, message: "Invalid id" });

    const customer = await Customer.findById(id);
    if (!customer)
      return res.status(404).json({ ok: false, message: "Customer not found" });

    if (customer.ownerUserId) {
      return res.status(409).json({
        ok: false,
        message: "This customer already has a linked login",
      });
    }

    const cleanEmail = String(email || "")
      .trim()
      .toLowerCase();
    if (!cleanEmail)
      return res.status(400).json({ ok: false, message: "email is required" });

    const password = String(tempPassword || "");
    if (password.length < 8)
      return res.status(400).json({
        ok: false,
        message: "tempPassword must be at least 8 characters",
      });

    const exists = await User.findOne({ email: cleanEmail }).lean();
    if (exists)
      return res
        .status(409)
        .json({ ok: false, message: "Email already exists" });

    const passwordHash = await User.hashPassword(password);

    const user = await User.create({
      fullName:
        String(fullName || "").trim() ||
        customer.contactName ||
        customer.companyName,
      email: cleanEmail,
      role: "client",
      isActive: true,
      clientId: customer._id,
      passwordHash,
      passwordChangedAt: new Date(),
    });

    customer.ownerUserId = user._id;
    await customer.save();

    return res.status(201).json({
      ok: true,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        clientId: user.clientId,
      },
      customer: {
        _id: customer._id,
        companyName: customer.companyName,
        contactName: customer.contactName,
        ownerUserId: customer.ownerUserId,
      },
    });
  } catch (e) {
    console.error("createCustomerLogin:", e);
    return res.status(500).json({
      ok: false,
      message: e?.message || "Server error",
    });
  }
}
