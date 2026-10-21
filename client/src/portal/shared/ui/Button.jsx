import React from "react";
import { Loader2 } from "lucide-react";

// Portal button (PUI-1). Same API as before; styling comes from the
// approved design system (.px-btn in theme/portalTheme.css).
const VARIANTS = {
  primary: "px-btn--primary",
  outline: "",
  secondary: "",
  ghost: "px-btn--ghost",
  danger: "px-btn--danger",
};
const SIZES = { sm: "px-btn--sm", md: "", lg: "px-btn--lg" };

const Button = React.forwardRef(function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  loading,
  type = "button",
  ...props
}, ref) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={["px-btn", VARIANTS[variant] ?? VARIANTS.primary, SIZES[size] ?? "", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});

export default Button;
