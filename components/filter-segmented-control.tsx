"use client"

import { BeakerIcon as Bee, Egg } from "lucide-react"

interface FilterSegmentedControlProps {
  onFilterChange: (filter: "all" | "revealed" | "unrevealed") => void
  currentFilter: "all" | "revealed" | "unrevealed"
}

export default function FilterSegmentedControl({ onFilterChange, currentFilter }: FilterSegmentedControlProps) {
  return (
    <div className="mb-4">
      <div className="bg-amber-100 p-1 rounded-lg flex">
        <button
          onClick={() => onFilterChange("all")}
          className={`flex-1 py-2 rounded-md transition-colors ${
            currentFilter === "all"
              ? "bg-amber-500 text-white font-medium shadow-sm"
              : "text-brown-600 hover:bg-amber-200"
          }`}
        >
          All
        </button>
        <button
          onClick={() => onFilterChange("revealed")}
          className={`flex-1 py-2 rounded-md transition-colors flex items-center justify-center gap-1 ${
            currentFilter === "revealed"
              ? "bg-amber-500 text-white font-medium shadow-sm"
              : "text-brown-600 hover:bg-amber-200"
          }`}
        >
          <Bee className="h-4 w-4" />
          <span className="hidden sm:inline">Revealed</span>
        </button>
        <button
          onClick={() => onFilterChange("unrevealed")}
          className={`flex-1 py-2 rounded-md transition-colors flex items-center justify-center gap-1 ${
            currentFilter === "unrevealed"
              ? "bg-amber-500 text-white font-medium shadow-sm"
              : "text-brown-600 hover:bg-amber-200"
          }`}
        >
          <Egg className="h-4 w-4" />
          <span className="hidden sm:inline">Unrevealed</span>
        </button>
      </div>
    </div>
  )
}
