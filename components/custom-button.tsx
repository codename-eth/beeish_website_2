"use client"

import type { ReactNode } from "react"
import Image from "next/image"
import { Loader2 } from "lucide-react"

interface CustomButtonProps {
  onClick: () => void
  children: ReactNode
  className?: string
  disabled?: boolean
}

export default function CustomButton({ onClick, children, className = "", disabled = false }: CustomButtonProps) {
  // Check if the button text is "Switching..."
  const isSwitching = typeof children === "string" && children === "Switching..."

  return (
    <button onClick={onClick} className={`relative h-12 min-w-[180px] group ${className}`} disabled={disabled}>
      <div className="relative w-full h-full">
        <Image
          src="/blank-button.png"
          alt="Button"
          fill
          className={`object-contain ${disabled ? "opacity-70" : ""}`}
          unoptimized={true}
        />
        <div className="absolute inset-0 flex items-center justify-center text-gray-900 font-bold text-lg">
          {isSwitching ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              <span>Switching...</span>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </button>
  )
}
