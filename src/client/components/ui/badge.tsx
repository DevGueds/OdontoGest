import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-teal-600 text-white shadow-sm hover:bg-teal-700",
        secondary:
          "border-transparent bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
        destructive:
          "border-transparent bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/50",
        outline:
          "text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
        success:
          "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
        warning:
          "border-amber-200 dark:border-amber-800/60 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
        info:
          "border-cyan-200 dark:border-cyan-800/60 bg-cyan-50 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300",
        purple:
          "border-purple-200 dark:border-purple-800/60 bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
