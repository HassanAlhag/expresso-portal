import React from "react";
import { useAccess } from "../../../shared/hooks/useAccess";
import RfqStaffDetail from "../components/RfqStaffDetail";
import VendorRFQDetailView from "../vendor/VendorRFQDetailView";

// RFQ detail (PUI-4): staff get the migrated page; vendor users keep the
// existing vendor view until the vendor portal is redesigned (PUI-5).
export default function RFQDetailsPage() {
  const access = useAccess();
  return access.role === "vendor" ? <VendorRFQDetailView /> : <RfqStaffDetail />;
}
