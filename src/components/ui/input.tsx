import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-[44px] w-full rounded-[14px] border border-[#e5e5ea] bg-white px-4 py-2 text-[16px] text-[#1d1d1f] ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#6e6e73] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007aff] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
