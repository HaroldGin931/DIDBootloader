type BadgeVariant = "success" | "error" | "warning" | "info";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-success-muted text-success",
  error: "bg-error-muted text-error",
  warning: "bg-[var(--color-warning-muted)] text-[var(--color-warning-default)]",
  info: "bg-primary-muted text-primary",
};

export function Badge({ variant = "info", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
