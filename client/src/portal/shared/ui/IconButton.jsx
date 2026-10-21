import React, { forwardRef } from "react";

// Square icon-only button. `label` is required: it becomes the accessible
// name and the tooltip, so icon-only controls are always understandable.
const IconButton = forwardRef(function IconButton(
  { label, children, badge, className = "", type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={["px-icon-btn", className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
      {badge ? (
        <span className="px-pip" aria-hidden="true">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </button>
  );
});

export default IconButton;
