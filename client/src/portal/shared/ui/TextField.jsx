import React, { forwardRef, useId } from "react";

// Labelled text input or textarea (PUI-2), matching SelectField. `hint`
// is linked with aria-describedby.
const TextField = forwardRef(function TextField(
  { label, hint, multiline = false, rows = 3, className = "", required, ...props },
  ref
) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const Tag = multiline ? "textarea" : "input";
  return (
    <div className={["px-field", className].filter(Boolean).join(" ")}>
      <label htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <Tag
        ref={ref}
        id={id}
        className="px-input"
        aria-describedby={hintId}
        aria-required={required || undefined}
        rows={multiline ? rows : undefined}
        {...props}
      />
      {hint ? (
        <span id={hintId} className="px-hint">
          {hint}
        </span>
      ) : null}
    </div>
  );
});

export default TextField;
