import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-blue-400/20 bg-blue-400/10 text-blue-400",
        secondary: "border-slate-600 bg-slate-700 text-slate-200",
        success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
        warning: "border-amber-400/20 bg-amber-400/10 text-amber-400",
        destructive: "border-red-400/20 bg-red-400/10 text-red-400",
        purple: "border-purple-400/20 bg-purple-400/10 text-purple-400",
        outline: "border-slate-600 text-slate-300",
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
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
