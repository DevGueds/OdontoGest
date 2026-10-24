import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-[38px] w-full rounded-[6px] border border-[#E8E8EC] bg-white px-3.5 py-2 text-sm text-[#0A0A0A] transition-all duration-150 placeholder:text-[#9C9C9C] focus-visible:outline-none focus-visible:border-[#2563EB] focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-[#121215] dark:text-zinc-100 dark:placeholder:text-zinc-500",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
