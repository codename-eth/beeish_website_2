"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-transparent hover:bg-slate-100 hover:text-slate-500",
        outline: "border border-slate-200 bg-transparent hover:bg-slate-100 hover:text-slate-900",
      },
      size: {
        default: "h-10 px-3",
        sm: "h-9 px-2.5",
        lg: "h-11 px-5",
      },
      pressed: {
        true: "bg-slate-100 text-slate-900",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      pressed: false,
    },
  },
)

interface ToggleProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof toggleVariants>, "pressed"> {
  pressed?: boolean
  onPressedChange?: (pressed: boolean) => void
  asChild?: boolean
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, variant, size, pressed, onPressedChange, asChild = false, ...props }, ref) => {
    const [internalPressed, setInternalPressed] = React.useState(false)

    const isPressed = pressed !== undefined ? pressed : internalPressed

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      const newPressed = !isPressed
      setInternalPressed(newPressed)
      onPressedChange?.(newPressed)
      props.onClick?.(event)
    }

    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        ref={ref}
        type="button"
        aria-pressed={isPressed}
        data-state={isPressed ? "on" : "off"}
        className={cn(toggleVariants({ variant, size, pressed: isPressed, className }))}
        onClick={handleClick}
        {...props}
      />
    )
  },
)

Toggle.displayName = "Toggle"

export { Toggle, toggleVariants }
