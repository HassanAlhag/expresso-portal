import mongoose from "mongoose";
import Message from "./message.model.js";

function validId(id) {
  return id && mongoose.Types.ObjectId.isValid(id);
}

function userId(req) {
  return req.user?.id || req.user?._id || null;
}

function isClientUser(req) {
  return new Set(["client", "staff_client", "procurement_client", "client_admin"]).has(
    req.user?.role || ""
  );
}

function canAccessCustomer(req, customerId) {
  if (!isClientUser(req)) return true;
  return Boolean(req.user?.clientId) && String(req.user.clientId) === String(customerId);
}

export async function listMessages(req, res) {
  try {
    const { customerId = "", page = "1", limit = "50" } = req.query;
    if (!customerId || !validId(customerId)) {
      return res.status(400).json({ ok: false, message: "customerId required" });
    }
    if (!canAccessCustomer(req, customerId)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      Message.find({ customerId })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("authorId", "fullName email avatarUrl role"),
      Message.countDocuments({ customerId }),
    ]);
    return res.json({ ok: true, items, total });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
}

export async function sendMessage(req, res) {
  try {
    const { customerId, body = "", attachmentUrls = [] } = req.body;
    const uid = userId(req);
    if (!uid) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }
    if (!customerId || !validId(customerId)) {
      return res.status(400).json({ ok: false, message: "customerId required" });
    }
    if (!canAccessCustomer(req, customerId)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }
    if (!body.trim() && attachmentUrls.length === 0) {
      return res.status(400).json({ ok: false, message: "body required" });
    }
    const clientRoles = new Set(["client", "staff_client", "procurement_client", "client_admin"]);
    const isFromAgency = !clientRoles.has(req.user?.role || "");
    const msg = await Message.create({
      customerId,
      authorId: uid,
      isFromAgency,
      body: body.trim(),
      attachmentUrls,
      readBy: [uid],
    });
    const populated = await msg.populate("authorId", "fullName email avatarUrl role");
    return res.status(201).json({ ok: true, item: populated });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
}

export async function markRead(req, res) {
  try {
    const { customerId } = req.params;
    const uid = userId(req);
    if (!uid) return res.status(401).json({ ok: false, message: "Unauthorized" });
    if (!customerId || !validId(customerId)) {
      return res.status(400).json({ ok: false, message: "customerId required" });
    }
    if (!canAccessCustomer(req, customerId)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }
    await Message.updateMany(
      { customerId, readBy: { $ne: uid } },
      { $addToSet: { readBy: uid } }
    );
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
}

export async function getUnreadCount(req, res) {
  try {
    const { customerId } = req.params;
    const uid = userId(req);
    if (!uid) return res.status(401).json({ ok: false, message: "Unauthorized" });
    if (!customerId || !validId(customerId)) {
      return res.json({ ok: true, count: 0 });
    }
    if (!canAccessCustomer(req, customerId)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }
    const count = await Message.countDocuments({
      customerId,
      readBy: { $ne: uid },
    });
    return res.json({ ok: true, count });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
}

export async function getNotificationCounts(req, res) {
  try {
    const uid = userId(req);
    if (!uid) return res.status(401).json({ ok: false, message: "Unauthorized" });
    const clientRoles = new Set(["client", "staff_client", "procurement_client", "client_admin"]);
    const isClient = clientRoles.has(req.user?.role || "");

    let unreadMessages = 0;
    if (isClient && req.user.clientId) {
      unreadMessages = await Message.countDocuments({
        customerId: req.user.clientId,
        readBy: { $ne: uid },
      });
    } else {
      // For agency staff: count all unread messages from clients
      unreadMessages = await Message.countDocuments({
        isFromAgency: false,
        readBy: { $ne: uid },
      });
    }

    return res.json({ ok: true, unreadMessages });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
}
