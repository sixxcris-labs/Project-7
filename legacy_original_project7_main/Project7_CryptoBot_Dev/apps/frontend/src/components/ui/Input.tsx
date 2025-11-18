import { InputHTMLAttributes, forwardRef, type ForwardedRef } from "react";
import clsx from "clsx";

export type InputSize = "md" | "lg";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variantSize?: InputSize;
}

function InputComponent(
  { variantSize = "md", className, ...rest }: InputProps,
  ref: ForwardedRef<HTMLInputElement>,
) {
  const classes = clsx("input", variantSize === "lg" && "input-lg", className);
  return <input ref={ref} className={classes} {...rest} />;
}

export const Input = forwardRef(InputComponent);
Input.displayName = "Input";

export default Input;
