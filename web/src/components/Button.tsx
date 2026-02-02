import { ButtonHTMLAttributes, CSSProperties } from "react";

type Variant = "primary" | "secondary" | "accent" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variantStyles: Record<Variant, { className: string; style?: CSSProperties }> = {
  primary: {
    className: "bg-primary text-primary-inverse hover:bg-primary-hover active:bg-[var(--color-primary-pressed)]",
  },
  accent: {
    className: "text-white hover:opacity-90",
    style: { background: "linear-gradient(135deg, var(--gradient-warm-from), var(--gradient-warm-to))" },
  },
  secondary: {
    className: "bg-transparent text-accent border border-accent hover:bg-accent-muted",
  },
  danger: {
    className: "bg-error text-white hover:opacity-90",
  },
};

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  children,
  className = "",
  style,
  ...props
}: ButtonProps) {
  const v = variantStyles[variant];
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-30 ${v.className} ${className}`}
      style={{ ...v.style, ...style }}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
