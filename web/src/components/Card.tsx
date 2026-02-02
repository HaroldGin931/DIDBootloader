interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-border-muted bg-bg p-4 shadow-[0_2px_4px_var(--color-shadow-default)] ${className}`}
    >
      {children}
    </div>
  );
}
