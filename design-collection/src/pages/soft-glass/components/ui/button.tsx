import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./utils"

const buttonVariants = cva(
  "glass-button",
  {
    variants: {
      variant: {
        default: "glass-button-primary",
        secondary: "bg-white/50 text-secondary-foreground hover:bg-white/70",
        destructive: "bg-destructive/80 text-destructive-foreground hover:bg-destructive/90 shadow-[0_4px_10px_-2px_rgba(255,0,0,0.3)]",
        ghost: "bg-transparent border-transparent shadow-none hover:bg-white/30",
        link: "text-primary underline-offset-4 hover:underline bg-transparent border-none shadow-none",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-xl px-4 text-xs",
        lg: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-12 w-12 p-0 flex items-center justify-center rounded-xl",
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
