import { usePortalPermissions } from "../hooks/usePortalPermissions";

/**
 * Conditionally renders children based on the user's permission set.
 *
 * Props:
 *   permission  — single permission key required (AND with others)
 *   permissions — array of permission keys (ALL must be present)
 *   any         — array of permission keys (ANY one is sufficient)
 *   fallback    — node to render when access is denied (default: null)
 *
 * Examples:
 *   <Can permission="hr.expenses.approve">
 *     <ApproveButton />
 *   </Can>
 *
 *   <Can any={["hr.expenses.approve", "hr.leaves.approve"]}>
 *     <ApprovalQueue />
 *   </Can>
 *
 *   <Can permissions={["hr.staff.write", "hr.scorecards.write"]}>
 *     <FullHRPanel />
 *   </Can>
 */
export default function Can({ permission, permissions, any, fallback = null, children }) {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePortalPermissions();

  let allowed = true;

  if (permission)   allowed = allowed && hasPermission(permission);
  if (permissions)  allowed = allowed && hasAllPermissions(permissions);
  if (any)          allowed = allowed && hasAnyPermission(any);

  return allowed ? children : fallback;
}
