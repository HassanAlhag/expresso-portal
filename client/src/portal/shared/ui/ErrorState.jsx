import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Button from "./Button";

// Errors explain what happened and offer a way forward; they don't apologise.
export default function ErrorState({
  title = "This didn't load",
  message = "The server didn't respond. Try again, and check your connection if it keeps happening.",
  onRetry,
  retryLabel = "Try again",
  className = "",
}) {
  return (
    <div role="alert" className={["px-surface px-state px-state--error", className].filter(Boolean).join(" ")}>
      <div className="px-glyph" aria-hidden="true">
        <AlertTriangle size={24} />
      </div>
      <h3>{title}</h3>
      {message ? <p>{message}</p> : null}
      {onRetry ? (
        <div className="px-btns">
          <Button onClick={onRetry}>
            <RefreshCw size={14} aria-hidden="true" />
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
