"use client"
import { useState, useEffect } from "react"
import NFTCard from "./nft-card"
import FilterToggleButtons from "./filter-toggle-buttons"

interface TokenIdNFTsProps {
  tokenIds: number[]
}

export default function TokenIdNFTs({ tokenIds }: TokenIdNFTsProps) {
  const [currentFilter, setCurrentFilter] = useState<"all" | "hives" | "bees">("all")
  const [filteredTokenIds, setFilteredTokenIds] = useState<number[]>(tokenIds)
  const [nftMetadata, setNftMetadata] = useState<Record<number, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [counts, setCounts] = useState({ all: 0, hives: 0, bees: 0 })

  // Fetch metadata for all tokens to determine hive/bee status
  useEffect(() => {
    const fetchAllMetadata = async () => {
      setIsLoading(true)
      const metadataPromises = tokenIds.map(async (tokenId) => {
        try {
          const response = await fetch(`https://secure-metadata-api-beeish.vercel.app/metadata/${tokenId}`)
          if (!response.ok) {
            console.error(`Error fetching metadata for token ${tokenId}: HTTP ${response.status}`)
            return { tokenId, data: null }
          }
          const data = await response.json()
          return { tokenId, data }
        } catch (error: any) {
          console.error(`Error fetching metadata for token ${tokenId}:`, error.message || "Unknown error")
          return { tokenId, data: null }
        }
      })

      const results = await Promise.all(metadataPromises)
      const metadataMap: Record<number, any> = {}

      results.forEach(({ tokenId, data }) => {
        metadataMap[tokenId] = data
      })

      setNftMetadata(metadataMap)
      setIsLoading(false)
    }

    fetchAllMetadata()
  }, [tokenIds])

  // Helper function to check if an NFT is a hive
  const isHive = (metadata: any): boolean => {
    if (!metadata || !metadata.attributes) return false

    // Check if any attribute has trait_type "hive"
    return metadata.attributes.some((attr: any) => attr.trait_type?.toLowerCase() === "hive")
  }

  // Apply filter when filter changes or metadata is loaded
  useEffect(() => {
    if (isLoading) return

    let hivesCount = 0
    let beesCount = 0

    // Count hives and bees
    tokenIds.forEach((tokenId) => {
      const metadata = nftMetadata[tokenId]
      if (metadata) {
        if (isHive(metadata)) {
          hivesCount++
        } else {
          beesCount++
        }
      }
    })

    // Update counts
    setCounts({
      all: tokenIds.length,
      hives: hivesCount,
      bees: beesCount,
    })

    // Apply filter
    if (currentFilter === "all") {
      setFilteredTokenIds(tokenIds)
    } else if (currentFilter === "hives") {
      const filtered = tokenIds.filter((tokenId) => {
        const metadata = nftMetadata[tokenId]
        return metadata && isHive(metadata)
      })
      setFilteredTokenIds(filtered)
    } else {
      // bees
      const filtered = tokenIds.filter((tokenId) => {
        const metadata = nftMetadata[tokenId]
        return metadata && !isHive(metadata)
      })
      setFilteredTokenIds(filtered)
    }
  }, [currentFilter, nftMetadata, isLoading, tokenIds])

  // Handle metadata updates from NFT cards
  const handleMetadataUpdate = (tokenId: number, metadata: any) => {
    setNftMetadata((prev) => ({
      ...prev,
      [tokenId]: metadata,
    }))
  }

  return (
    <div id="nft-results" className="w-full">
      {/* Filter buttons */}
      <FilterToggleButtons onFilterChange={setCurrentFilter} currentFilter={currentFilter} counts={counts} />

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      ) : filteredTokenIds.length === 0 ? (
        <div className="bg-amber-100 border border-amber-300 rounded-lg p-4 text-center">
          <p className="text-brown-600">No {currentFilter === "hives" ? "hives" : "bees"} found.</p>
        </div>
      ) : (
        <>
          {/* Enhanced responsive grid with more breakpoints */}
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
            {filteredTokenIds.map((tokenId) => (
              <NFTCard
                key={tokenId}
                tokenId={tokenId}
                initialMetadata={nftMetadata[tokenId]}
                onMetadataUpdate={handleMetadataUpdate}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
