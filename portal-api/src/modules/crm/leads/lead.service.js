import mongoose from "mongoose";
import Account from "../accounts/account.model.js";
import Contact from "../contacts/contact.model.js";

export const PLAN_BUILDER_SOURCE = "plan_builder";

function validId(id) {
  return id && mongoose.Types.ObjectId.isValid(id);
}

function objectId(value) {
  const id = value?._id || value;
  return validId(id) ? id : null;
}

function cleanString(value) {
  return String(value || "").trim();
}

function cleanEmail(value) {
  return cleanString(value).toLowerCase();
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function accountNameForLead(lead) {
  const companyName = cleanString(lead?.companyName);
  if (companyName && companyName.toLowerCase() !== "plan builder submission") {
    return companyName;
  }

  return cleanString(lead?.fullName);
}

export function normalizeLeadSource(value, fallback = "manual") {
  const source = cleanString(value || fallback).toLowerCase();
  return source || fallback;
}

export function buildLeadPayload(body = {}, actorUserId = null) {
  const ownerUserId = objectId(body.ownerUserId);

  return {
    fullName: cleanString(body.fullName),
    companyName: cleanString(body.companyName),
    email: cleanEmail(body.email),
    phone: cleanString(body.phone),
    service: cleanString(body.service),
    source: normalizeLeadSource(body.source),
    status: cleanString(body.status || "new").toLowerCase(),
    ownerUserId,
    notes: cleanString(body.notes),
    createdBy: validId(actorUserId) ? actorUserId : null,
    updatedBy: validId(actorUserId) ? actorUserId : null,
  };
}

export async function ensureAccountForLead(leadInput, actorUserId = null) {
  const lead =
    typeof leadInput?.toObject === "function" ? leadInput.toObject() : leadInput;
  const name = accountNameForLead(lead);

  if (!lead?._id || !name) return null;

  if (objectId(lead.convertedToAccountId)) {
    const linked = await Account.findById(objectId(lead.convertedToAccountId));
    if (linked) return linked;
  }

  const email = cleanEmail(lead.email);
  const exactName = new RegExp(`^${escapeRegex(name)}$`, "i");
  const match = await Account.findOne({
    $or: [email ? { email } : null, { name: exactName }].filter(Boolean),
  });

  const notes = [
    `Created from lead: ${cleanString(lead.fullName)}`,
    cleanString(lead.service) ? `Service: ${cleanString(lead.service)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  if (match) {
    const patch = {
      ownerUserId: objectId(match.ownerUserId) || objectId(lead.ownerUserId),
      updatedBy: validId(actorUserId) ? actorUserId : null,
    };
    if (!match.email && email) patch.email = email;
    if (!match.phone && cleanString(lead.phone)) patch.phone = cleanString(lead.phone);
    return Account.findByIdAndUpdate(match._id, patch, { new: true });
  }

  return Account.create({
    name,
    email,
    phone: cleanString(lead.phone),
    ownerUserId: objectId(lead.ownerUserId),
    status: "active",
    notes,
    createdBy: validId(actorUserId) ? actorUserId : null,
    updatedBy: validId(actorUserId) ? actorUserId : null,
  });
}

export async function ensureContactForLead(
  leadInput,
  actorUserId = null,
  options = {}
) {
  const lead =
    typeof leadInput?.toObject === "function" ? leadInput.toObject() : leadInput;

  if (!lead?._id || !cleanString(lead.fullName)) return null;

  const leadId = lead._id;
  const email = cleanEmail(lead.email);
  const phone = cleanString(lead.phone);

  let existing = await Contact.findOne({ leadId }).lean();

  if (!existing && email) {
    existing = await Contact.findOne({ email, leadId: null }).lean();
  }

  if (!existing && !email && phone) {
    existing = await Contact.findOne({ phone, leadId: null }).lean();
  }

  const service = cleanString(lead.service);
  const notes = [
    service ? `Service: ${service}` : "",
    cleanString(lead.notes),
  ]
    .filter(Boolean)
    .join("\n\n");

  const accountId = objectId(
    options.accountId || lead.accountId || lead.convertedToAccountId
  );
  const payload = {
    fullName: cleanString(lead.fullName),
    email,
    phone,
    whatsapp: phone,
    leadId,
    ownerUserId: objectId(lead.ownerUserId),
    source: normalizeLeadSource(lead.source),
    notes,
    updatedBy: validId(actorUserId) ? actorUserId : null,
  };
  if (accountId) payload.accountId = accountId;

  if (existing?._id) {
    return Contact.findByIdAndUpdate(existing._id, payload, { new: true }).lean();
  }

  return Contact.create({
    ...payload,
    createdBy: validId(actorUserId) ? actorUserId : null,
  });
}
