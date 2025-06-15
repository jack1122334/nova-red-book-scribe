
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium font-serif ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 tracking-wide shadow-black hover:shadow-black-strong hover:-translate-y-1 active:translate-y-0 border-2",
  {
    variants: {
      variant: {
        default: "bg-black text-white border-black hover:bg-gray-800 hover:border-gray-800",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 border-red-600 hover:border-red-700",
        outline:
          "border-black bg-white hover:bg-gray-100 text-black",
        secondary:
          "bg-white text-black hover:bg-gray-100 border-black",
        ghost: "hover:bg-white hover:text-black shadow-none hover:shadow-black border-transparent hover:border-black",
        link: "text-black underline-offset-4 hover:underline shadow-none border-transparent",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-xl px-4",
        lg: "h-12 rounded-2xl px-8",
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
