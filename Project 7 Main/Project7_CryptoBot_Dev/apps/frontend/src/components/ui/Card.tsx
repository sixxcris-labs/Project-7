import type { ElementType, FC, ReactNode } from "react";
import clsx from "clsx";

export type CardVariant = "default" | "glass";

export type CardProps = {
  children: ReactNode;
  className?: string;
  variant?: CardVariant;
  as?: ElementType;
};

export function Card({ children, className, variant = "default", as: Tag = "div" }: CardProps) {
  const classes = clsx("card", variant === "glass" && "glass", className);
  return <Tag className={classes}>{children}</Tag>;
}

export default Card;
