// Vendor access to RFQs (approved access model, R2).
//
// A vendor is an external user linked to an ACTIVE ProcurementVendor profile.
// That profile only exists once staff have approved the vendor's application
// (and the vendor has accepted their invitation), so "has an active profile"
// is what "approved vendor" means here. Role names are not used.
import ProcurementVendor from "./vendor.model.js";
import { canSeeAllTenantRecords } from "../../utils/accessControl.js";

export async function findActiveVendorProfile(userId) {
  if (!userId) return null;
  return ProcurementVendor.findOne({ userId, isActive: true }).lean();
}

/** Internal staff, or an approved vendor (sets req.vendorProfile). */
export async function requireStaffOrApprovedVendor(req, res, next) {
  try {
    if (canSeeAllTenantRecords(req)) return next();
    const vendor = await findActiveVendorProfile(req.user?.id);
    if (!vendor) return res.status(403).json({ ok: false, message: "Forbidden" });
    req.vendorProfile = vendor;
    return next();
  } catch (e) {
    console.error("requireStaffOrApprovedVendor:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

/** Approved vendors only (internal staff do not submit quotations). */
export async function requireApprovedVendor(req, res, next) {
  try {
    if (canSeeAllTenantRecords(req)) return res.status(403).json({ ok: false, message: "Forbidden" });
    const vendor = await findActiveVendorProfile(req.user?.id);
    if (!vendor) return res.status(403).json({ ok: false, message: "Forbidden" });
    req.vendorProfile = vendor;
    return next();
  } catch (e) {
    console.error("requireApprovedVendor:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

/** True when the RFQ is in at least one of the vendor's approved categories. */
export function rfqMatchesVendor(rfq, vendor) {
  const vendorCats = new Set((vendor?.categories || []).map(String));
  return (rfq?.subcategoryIds || []).some((c) => vendorCats.has(String(c?._id || c)));
}

// Fields a vendor may see. Internal links (procurement request / client),
// creator details and internal timestamps are left out.
export const VENDOR_RFQ_FIELDS = "rfqNumber title description deadline status subcategoryIds attachments publishedAt closedAt";
