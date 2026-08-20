import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-emerald-600 text-white shadow-md shadow-emerald-600/10 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500",
        destructive:
          "bg-rose-600 text-white shadow-md shadow-rose-600/10 hover:bg-rose-700",
        outline:
          "border border-emerald-600 text-emerald-700 bg-white hover:bg-emerald-50 dark:bg-transparent dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950/60",
        secondary:
          "bg-amber-500 text-emerald-950 hover:bg-amber-600 shadow-md shadow-amber-500/20 font-extrabold",
        ghost:
          "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-emerald-900/40",
        link: "text-emerald-600 underline-offset-4 hover:underline dark:text-emerald-400",
        accent: "bg-emerald-900 text-emerald-100 hover:bg-emerald-800 border border-emerald-700/50"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-[11px]",
        lg: "h-12 px-6 text-sm",
        icon: "h-9 w-9 p-0 rounded-xl"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
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
