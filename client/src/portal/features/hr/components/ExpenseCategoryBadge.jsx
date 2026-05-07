import React from "react";
import Badge from "../../../shared/ui/Badge";
import {
  Car,
  Utensils,
  ShoppingBag,
  Laptop,
  Handshake,
  Plane,
  Hotel,
  Phone,
  Fuel,
  Printer,
  Package,
  MoreHorizontal,
} from "lucide-react";

const CATEGORY_META = {
  transportation: {
    label: "Transportation",
    tone: "info",
    Icon: Car,
  },
  meals: {
    label: "Meals",
    tone: "warning",
    Icon: Utensils,
  },
  office_supplies: {
    label: "Office Supplies",
    tone: "neutral",
    Icon: ShoppingBag,
  },
  software_subscription: {
    label: "Software / Subscription",
    tone: "info",
    Icon: Laptop,
  },
  client_meeting: {
    label: "Client Meeting",
    tone: "success",
    Icon: Handshake,
  },
  travel: {
    label: "Travel",
    tone: "info",
    Icon: Plane,
  },
  accommodation: {
    label: "Accommodation",
    tone: "warning",
    Icon: Hotel,
  },
  communication: {
    label: "Communication",
    tone: "neutral",
    Icon: Phone,
  },
  fuel_parking: {
    label: "Fuel / Parking",
    tone: "warning",
    Icon: Fuel,
  },
  printing: {
    label: "Printing",
    tone: "neutral",
    Icon: Printer,
  },
  equipment: {
    label: "Equipment",
    tone: "info",
    Icon: Package,
  },
  other: {
    label: "Other",
    tone: "neutral",
    Icon: MoreHorizontal,
  },
};

export default function ExpenseCategoryBadge({ category, showIcon = true }) {
  const key = String(category || "other").toLowerCase();
  const meta = CATEGORY_META[key] || CATEGORY_META.other;
  const Icon = meta.Icon;

  return (
    <Badge tone={meta.tone}>
      {showIcon ? <Icon size={12} /> : null}
      {meta.label}
    </Badge>
  );
}
