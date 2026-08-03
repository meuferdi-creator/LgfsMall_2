import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase tracking-wide",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-700/50",
        secondary:
          "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700/50",
        destructive:
          "border-transparent bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700/50",
        outline: "text-slate-700 border-slate-200 dark:text-slate-300 dark:border-slate-700",
        info: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700/50",
        purple: "border-transparent bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-700/50"
      }
    },
    defaultVariants: {
      variant: "default"
    }
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
