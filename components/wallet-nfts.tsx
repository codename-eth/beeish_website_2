"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import NFTCard from "./nft-card"
import { BEEISH_CONTRACT_ABI, BEEISH_CONTRACT_ADDRESS } from "@/lib/contract-abi"
import FilterToggleButtons from "./filter-toggle-buttons"

interface WalletNFTsProps {
  walletAddress: string
  onReset: () => void
}

export default function WalletNFTs({ walletAddress, onReset }: WalletNFTsProps) {
  const [tokenIds, setTokenIds] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentFilter, setCurrentFilter] = useState<"all" | "hives" | "bees">("all")
  const [filteredTokenIds, setFilteredTokenIds] = useState<number[]>([])
  const [nftMetadata, setNftMetadata] = useState<Record<number, any>>({})
  const [isMetadataLoading, setIsMetadataLoading] = useState(false)
  const [counts, setCounts] = useState({ all: 0, hives: 0, bees: 0 })

  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Validate the wallet address
        if (!ethers.isAddress(walletAddress)) {
          console.error("Invalid wallet address format")
          throw new Error("Invalid wallet address")
        }

        // Create a provider for Abstract Chain
        const provider = new ethers.JsonRpcProvider("https://api.mainnet.abs.xyz")

        // Create a contract instance
        const contract = new ethers.Contract(BEEISH_CONTRACT_ADDRESS, BEEISH_CONTRACT_ABI, provider)

        // Call the tokensOfOwner function to get all NFTs owned by the wallet
        const tokens = await contract.tokensOfOwner(walletAddress)

        // Convert BigNumber array to number array
        const tokenIdNumbers = tokens.map((token: bigint) => Number(token))

        setTokenIds(tokenIdNumbers)
        setFilteredTokenIds(tokenIdNumbers)
        setCounts({ all: tokenIdNumbers.length, hives: 0, bees: 0 })

        if (tokenIdNumbers.length === 0) {
          console.error("No NFTs found for this wallet address")
          setError("No Bee-ish NFTs found for this wallet")
        } else {
          // Fetch metadata for filtering
          fetchMetadata(tokenIdNumbers)
        }
      } catch (err: any) {
        console.error("Error fetching NFTs:", err.message || "Unknown error")
        setError(err.message || "Failed to fetch NFTs")
      } finally {
        setIsLoading(false)
      }
    }

    if (walletAddress) {
      fetchNFTs()
    }
  }, [walletAddress])

  const fetchMetadata = async (ids: number[]) => {
    setIsMetadataLoading(true)

    const metadataPromises = ids.map(async (tokenId) => {
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
    let hivesCount = 0
    let beesCount = 0

    results.forEach(({ tokenId, data }) => {
      metadataMap[tokenId] = data

      // Count hives and bees
      if (data && data.attributes) {
        const isHiveNFT = data.attributes.some((attr: any) => attr.trait_type?.toLowerCase() === "hive")

        if (isHiveNFT) {
          hivesCount++
        } else {
          beesCount++
        }
      }
    })

    setNftMetadata(metadataMap)
    setCounts({
      all: ids.length,
      hives: hivesCount,
      bees: beesCount,
    })
    setIsMetadataLoading(false)
  }

  // Helper function to check if an NFT is a hive
  const isHive = (metadata: any): boolean => {
    if (!metadata || !metadata.attributes) return false

    // Check if any attribute has trait_type "hive"
    return metadata.attributes.some((attr: any) => attr.trait_type?.toLowerCase() === "hive")
  }

  // Apply filter when filter changes or metadata is loaded
  useEffect(() => {
    if (isMetadataLoading || Object.keys(nftMetadata).length === 0) return

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
  }, [currentFilter, nftMetadata, isMetadataLoading, tokenIds])

  // Handle metadata updates from NFT cards
  const handleMetadataUpdate = (tokenId: number, metadata: any) => {
    // Update the metadata in our state
    setNftMetadata((prev) => {
      const newMetadata = {
        ...prev,
        [tokenId]: metadata,
      }

      // Recalculate counts
      let hivesCount = 0
      let beesCount = 0

      tokenIds.forEach((id) => {
        const meta = newMetadata[id]
        if (meta && meta.attributes) {
          const isHiveNFT = meta.attributes.some((attr: any) => attr.trait_type?.toLowerCase() === "hive")
          if (isHiveNFT) {
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

      // Reapply filter
      if (currentFilter === "all") {
        // No need to update filtered tokens
      } else if (currentFilter === "hives") {
        const filtered = tokenIds.filter((id) => {
          const meta = newMetadata[id]
          return meta && isHive(meta)
        })
        setFilteredTokenIds(filtered)
      } else {
        // bees
        const filtered = tokenIds.filter((id) => {
          const meta = newMetadata[id]
          return meta && !isHive(meta)
        })
        setFilteredTokenIds(filtered)
      }

      return newMetadata
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-12 w-12 animate-spin text-amber-600 mb-4" />
        <p className="text-lg text-gray-700">Fetching NFTs for {walletAddress}...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 max-w-md w-full">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <button onClick={onReset} className="relative h-12 w-32 hover:scale-105 transition-transform duration-200">
          <div className="relative w-full h-full">
            <Image src="/connect-button.png" alt="Try Again" fill className="object-contain" />
            <div className="absolute inset-0 flex items-center justify-center text-gray-900 font-bold">Try Again</div>
          </div>
        </button>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Filter buttons */}
      {!isMetadataLoading && (
        <FilterToggleButtons onFilterChange={setCurrentFilter} currentFilter={currentFilter} counts={counts} />
      )}

      {isMetadataLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600 mr-2" />
          <p>Loading metadata for filtering...</p>
        </div>
      ) : filteredTokenIds.length === 0 ? (
        <div className="bg-amber-100 border border-amber-300 rounded-lg p-4 text-center">
          <p className="text-brown-600">No {currentFilter === "hives" ? "hives" : "bees"} found in this wallet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {filteredTokenIds.map((tokenId) => (
            <NFTCard
              key={tokenId}
              tokenId={tokenId}
              contractAddress={BEEISH_CONTRACT_ADDRESS}
              initialMetadata={nftMetadata[tokenId]}
              onMetadataUpdate={handleMetadataUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// This component uses ethers.js directly rather than wagmi hooks for blockchain interaction.
// However, we should ensure it's compatible with the rest of the application.

// This is using ethers v6 which is compatible with wagmi v2, so no changes needed.
