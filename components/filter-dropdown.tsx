"use client"

import { ChevronDown, BeakerIcon as Bee, Egg } from "lucide-react"
import { useState, useRef, useEffect } from "react"

interface FilterDropdownProps {
  onFilterChange: (filter: "all" | "revealed" | "unrevealed") => void
  currentFilter: "all" | "revealed" | "unrevealed"
}

export default function FilterDropdown({ onFilterChange, currentFilter }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const getFilterLabel = () => {
    switch (currentFilter) {
      case "revealed":
        return (
          <div className="flex items-center gap-2">
            <Bee className="h-4 w-4" />
            <span>Revealed Bees</span>
          </div>
        )
      case "unrevealed":
        return (
          <div className="flex items-center gap-2">
            <Egg className="h-4 w-4" />
            <span>Unrevealed Hives</span>
          </div>
        )
      default:
        return <span>All NFTs</span>
    }
  }

  return (
    <div className="relative mb-4" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-amber-200 border-2 border-amber-500 rounded-lg px-4 py-2 text-brown-600 hover:bg-amber-300 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">Filter:</span>
          {getFilterLabel()}
        </div>
        <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border-2 border-amber-500 rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={() => {
              onFilterChange("all")
              setIsOpen(false)
            }}
            className={`w-full text-left px-4 py-2 hover:bg-amber-100 ${
              currentFilter === "all" ? "bg-amber-200 font-medium" : ""
            }`}
          >
            All NFTs
          </button>
          <button
            onClick={() => {
              onFilterChange("revealed")
              setIsOpen(false)
            }}
            className={`w-full text-left px-4 py-2 hover:bg-amber-100 ${
              currentFilter === "revealed" ? "bg-amber-200 font-medium" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <Bee className="h-4 w-4" />
              <span>Revealed Bees</span>
            </div>
          </button>
          <button
            onClick={() => {
              onFilterChange("unrevealed")
              setIsOpen(false)
            }}
            className={`w-full text-left px-4 py-2 hover:bg-amber-100 ${
              currentFilter === "unrevealed" ? "bg-amber-200 font-medium" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <Egg className="h-4 w-4" />
              <span>Unrevealed Hives</span>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
