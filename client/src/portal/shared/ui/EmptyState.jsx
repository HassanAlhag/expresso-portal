import React from "react";
import Button from "./Button";

// Empty states say what is missing and invite the next action.
export default function EmptyState({
  icon: Icon,
  title = "Nothing here yet",
  message = "",
  actionLabel,
  onAction,
  action,
  className = "",
}) {
  return (
    <div className={["px-surface px-state", className].filter(Boolean).join(" ")}>
      {Icon ? (
        <div className="px-glyph" aria-hidden="true">
          <Icon size={24} />
        </div>
      ) : null}
      <h3>{title}</h3>
      {message ? <p>{message}</p> : null}
      {action || (actionLabel && onAction) ? (
        <div className="px-btns">{action || <Button onClick={onAction}>{actionLabel}</Button>}</div>
      ) : null}
    </div>
  );
}
