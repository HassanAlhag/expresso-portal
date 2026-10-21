import React from "react";
import { Info } from "lucide-react";

// Inline notice: info or warn. Not a toast; it stays with the content it
// explains.
export default function Alert({ tone = "info", icon: Icon = Info, title, children, action, role }) {
  return (
    <div className="px-alert" data-tone={tone} role={role}>
      <Icon size={18} aria-hidden="true" />
      <div>
        {title ? <b>{title}</b> : null}
        {typeof children === "string" ? <p>{children}</p> : children}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
