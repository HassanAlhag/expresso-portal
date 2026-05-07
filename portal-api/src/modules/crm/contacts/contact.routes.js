import express from "express";
import { requireAuth, requireRole } from "../../../middleware/auth.js";
import {
  listContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
} from "./contact.controller.js";

const router = express.Router();

const staff = requireRole("super_admin", "admin", "staff");

router.get("/", requireAuth, staff, listContacts);
router.get("/:id", requireAuth, staff, getContact);
router.post("/", requireAuth, staff, createContact);
router.patch("/:id", requireAuth, staff, updateContact);
router.delete("/:id", requireAuth, requireRole("super_admin", "admin"), deleteContact);

export default router;
