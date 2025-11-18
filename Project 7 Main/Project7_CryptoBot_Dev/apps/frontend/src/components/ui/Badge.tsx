import type { FC, ReactNode } from "react";
import clsx from "clsx";

export type BadgeVariant = "positive" | "negative" | "warn" | "neutral";

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  const classes = clsx(
    "badge",
    variant === "positive" && "badge-positive",
    variant === "negative" && "badge-negative",
    variant === "warn" && "badge-warn",
    variant === "neutral" && "badge-neutral",
    className,
  );

  return <span className={classes}>{children}</span>;
}

export default Badge;
