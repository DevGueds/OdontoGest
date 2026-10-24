import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#6366F1] text-white",
        secondary:
          "border-[#E8E8EC] dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/80 text-[#6B6B6B] dark:text-zinc-400",
        outline:
          "border-[#E8E8EC] dark:border-zinc-800 text-[#0A0A0A] dark:text-zinc-200 bg-transparent",
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400",
        warning:
          "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400",
        destructive:
          "border-red-500/20 bg-red-500/10 text-[#EF4444] dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400",
        info:
          "border-indigo-500/20 bg-indigo-500/10 text-[#6366F1] dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-400",
        purple:
          "border-purple-500/20 bg-purple-500/10 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/15 dark:text-purple-400",
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
