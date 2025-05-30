"use client"

interface FilterToggleButtonsProps {
  onFilterChange: (filter: "all" | "hives" | "bees") => void
  currentFilter: "all" | "hives" | "bees"
  counts: {
    all: number
    hives: number
    bees: number
  }
}

export default function FilterToggleButtons({ onFilterChange, currentFilter, counts }: FilterToggleButtonsProps) {
  return (
    <div className="flex rounded-lg overflow-hidden border-2 border-amber-500 mb-4">
      <button
        onClick={() => onFilterChange("all")}
        className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 ${
          currentFilter === "all"
            ? "bg-amber-500 text-white font-bold"
            : "bg-amber-200 text-brown-600 hover:bg-amber-300"
        }`}
      >
        <span>All</span>
        <span className="bg-amber-600/20 text-white text-xs font-medium px-2 py-0.5 rounded-full">{counts.all}</span>
      </button>
      <button
        onClick={() => onFilterChange("hives")}
        className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 ${
          currentFilter === "hives"
            ? "bg-amber-500 text-white font-bold"
            : "bg-amber-200 text-brown-600 hover:bg-amber-300"
        }`}
      >
        <span>Hives</span>
        <span className="bg-amber-600/20 text-white text-xs font-medium px-2 py-0.5 rounded-full">{counts.hives}</span>
      </button>
      <button
        onClick={() => onFilterChange("bees")}
        className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 ${
          currentFilter === "bees"
            ? "bg-amber-500 text-white font-bold"
            : "bg-amber-200 text-brown-600 hover:bg-amber-300"
        }`}
      >
        <span>Bees</span>
        <span className="bg-amber-600/20 text-white text-xs font-medium px-2 py-0.5 rounded-full">{counts.bees}</span>
      </button>
    </div>
  )
}
