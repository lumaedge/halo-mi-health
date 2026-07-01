import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[15px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007aff] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-[18px] [&_svg]:shrink-0 select-none",
  {
    variants: {
      variant: {
        default: "bg-[#007aff] text-white hover:bg-[#0066d6] active:scale-[0.97] rounded-[14px]",
        destructive: "bg-[#ff3b30] text-white hover:bg-[#d62d22] active:scale-[0.97] rounded-[14px]",
        outline: "bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-xl active:scale-[0.97] rounded-[14px]",
        secondary: "bg-white/10 text-white hover:bg-white/20 backdrop-blur-xl active:scale-[0.97] rounded-[14px]",
        ghost: "text-white/70 hover:bg-white/10 hover:text-white rounded-[14px]",
        link: "text-[#007aff] underline-offset-4 hover:underline",
        plain: "text-[#007aff] hover:text-[#0066d6] rounded-[14px]",
      },
      size: {
        default: "h-[44px] px-5 py-2",
        sm: "h-[36px] rounded-[12px] px-4 text-[14px]",
        lg: "h-[50px] rounded-[16px] px-7 text-[17px]",
        xl: "h-[56px] rounded-[18px] px-8 text-[18px]",
        icon: "h-[44px] w-[44px] rounded-[14px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
