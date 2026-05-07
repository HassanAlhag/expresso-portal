// src/portal/app/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("portal_token");
  if (!token) return <Navigate to="/portal/login" replace />;
  return children;
}
