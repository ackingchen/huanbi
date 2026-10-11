import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
const variants = cva("ui-button", {
  variants: { variant: { default: "ui-default", outline: "ui-outline" } },
  defaultVariants: { variant: "default" },
});
export const Button = forwardRef(function Button(
  { asChild = false, variant, className, ...props },
  ref,
) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      ref={ref}
      className={twMerge(clsx(variants({ variant }), className))}
      {...props}
    />
  );
});
