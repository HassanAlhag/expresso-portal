import React from "react";
import ProductionJobFormModal from "./ProductionJobFormModal";

export default function ProductionCreateModal(props) {
  return <ProductionJobFormModal {...props} mode="create" />;
}
