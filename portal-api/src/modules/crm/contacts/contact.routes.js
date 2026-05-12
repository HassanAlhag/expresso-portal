import express from "express";
import { requireAuth, requirePermission } from "../../../middleware/auth.js";
import {
  listContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
} from "./contact.controller.js";

const router = express.Router();

router.get("/", requireAuth, requirePermission("crm.read"), listContacts);
router.get("/:id", requireAuth, requirePermission("crm.read"), getContact);
router.post("/", requireAuth, requirePermission("crm.write"), createContact);
router.patch("/:id", requireAuth, requirePermission("crm.write"), updateContact);
router.delete("/:id", requireAuth, requirePermission("crm.delete"), deleteContact);

export default router;
