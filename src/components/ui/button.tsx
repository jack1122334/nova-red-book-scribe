
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium font-serif ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 tracking-wide shadow-notion hover:shadow-notion-hover hover:-translate-y-0.5 active:translate-y-0",
  {
    variants: {
      variant: {
        default: "bg-gray-900 text-white hover:bg-gray-800 border border-gray-900 hover:border-gray-800",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 border border-red-600 hover:border-red-700",
        outline:
          "border border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 text-gray-900",
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200 hover:border-gray-300",
        ghost: "hover:bg-gray-100 hover:text-gray-900 shadow-none hover:shadow-sm",
        link: "text-gray-900 underline-offset-4 hover:underline shadow-none",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-lg px-4",
        lg: "h-12 rounded-xl px-8",
        icon: "h-11 w-11",
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
