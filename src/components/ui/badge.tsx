import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-[13px] font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#e8f0fe] text-[#007aff]",
        secondary: "bg-[#f5f5f7] text-[#6e6e73]",
        destructive: "bg-[#fce8e6] text-[#ff3b30]",
        success: "bg-[#e8f5e9] text-[#34c759]",
        warning: "bg-[#fef0d9] text-[#ff9f0a]",
        teal: "bg-[#e4f2fb] text-[#5ac8fa]",
        outline: "bg-transparent text-[#6e6e73] border border-[#e5e5ea]",
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
