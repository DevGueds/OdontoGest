import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[6px] text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none hover:-translate-y-[1px] active:translate-y-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#2563EB] text-white hover:bg-[#1D4ED8] hover:shadow-[0_4px_12px_rgba(37,99,235,0.25)]",
        destructive:
          "border border-red-200 dark:border-red-900/50 bg-transparent text-[#EF4444] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30",
        outline:
          "border border-[#E8E8EC] dark:border-zinc-800 bg-transparent text-[#0A0A0A] dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80",
        secondary:
          "bg-zinc-100 text-[#0A0A0A] hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
        ghost:
          "text-[#6B6B6B] dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-[#0A0A0A] dark:hover:text-zinc-100",
        link:
          "text-[#2563EB] underline-offset-4 hover:underline",
        emerald:
          "border border-emerald-200 dark:border-emerald-800/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15",
      },
      size: {
        default: "h-[38px] px-4 py-2",
        sm: "h-8 rounded-[6px] px-3 text-xs",
        lg: "h-11 rounded-[6px] px-6 text-base font-medium",
        icon: "h-[38px] w-[38px] rounded-[6px]",
        iconSm: "h-8 w-8 rounded-[6px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
