import React from "react";
import { useAccess } from "../../../shared/hooks/useAccess";
import RfqStaffList from "../components/RfqStaffList";
import VendorRFQsView from "../vendor/VendorRFQsView";

// RFQs (PUI-4): staff get the migrated list; vendor users keep the existing
// vendor view until the vendor portal is redesigned (PUI-5).
export default function RFQsPage() {
  const access = useAccess();
  return access.role === "vendor" ? <VendorRFQsView /> : <RfqStaffList />;
}
