"use client"

import { BeakerIcon as Bee, Egg, Grid } from "lucide-react"

interface FilterTabsProps {
  onFilterChange: (filter: "all" | "revealed" | "unrevealed") => void
  currentFilter: "all" | "revealed" | "unrevealed"
  counts: {
    all: number
    revealed: number
    unrevealed: number
  }
}

export default function FilterTabs({ onFilterChange, currentFilter, counts }: FilterTabsProps) {
  return (
    <div className="mb-6">
      <div className="flex border-b border-amber-300">
        <button
          onClick={() => onFilterChange("all")}
          className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors ${
            currentFilter === "all"
              ? "border-b-2 border-amber-500 text-amber-600"
              : "text-gray-600 hover:text-amber-500"
          }`}
        >
          <Grid className="h-4 w-4" />
          <span>All NFTs</span>
          <span className="ml-1 bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded-full">
            {counts.all}
          </span>
        </button>
        <button
          onClick={() => onFilterChange("revealed")}
          className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors ${
            currentFilter === "revealed"
              ? "border-b-2 border-amber-500 text-amber-600"
              : "text-gray-600 hover:text-amber-500"
          }`}
        >
          <Bee className="h-4 w-4" />
          <span>Revealed Bees</span>
          <span className="ml-1 bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded-full">
            {counts.revealed}
          </span>
        </button>
        <button
          onClick={() => onFilterChange("unrevealed")}
          className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors ${
            currentFilter === "unrevealed"
              ? "border-b-2 border-amber-500 text-amber-600"
              : "text-gray-600 hover:text-amber-500"
          }`}
        >
          <Egg className="h-4 w-4" />
          <span>Unrevealed Hives</span>
          <span className="ml-1 bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded-full">
            {counts.unrevealed}
          </span>
        </button>
      </div>
    </div>
  )
}
