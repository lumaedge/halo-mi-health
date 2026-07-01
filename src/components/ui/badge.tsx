import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-[13px] font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#007aff]/20 text-[#007aff]",
        secondary: "bg-white/10 text-white/60",
        destructive: "bg-[#ff3b30]/20 text-[#ff3b30]",
        success: "bg-[#34c759]/20 text-[#34c759]",
        warning: "bg-[#ff9f0a]/20 text-[#ff9f0a]",
        teal: "bg-[#5ac8fa]/20 text-[#5ac8fa]",
        outline: "bg-transparent text-white/60 border border-white/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
