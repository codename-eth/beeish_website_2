"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import NFTDetailModal from "./nft-detail-modal"

interface NFTCardProps {
  tokenId: number
  contractAddress?: string
  initialMetadata?: any
  onMetadataUpdate?: (tokenId: number, metadata: any) => void
}

export default function NFTCard({ tokenId, contractAddress, initialMetadata, onMetadataUpdate }: NFTCardProps) {
  const [metadata, setMetadata] = useState<any>(initialMetadata || null)
  const [isLoading, setIsLoading] = useState(!initialMetadata)
  const [imageError, setImageError] = useState(false)
  const [metadataError, setMetadataError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Placeholder image while loading or if there's an error
  const placeholderImage = `/placeholder.svg?height=300&width=300&query=Bee-ish NFT ${tokenId}`

  // Helper function to ensure image URL is valid
  const validateImageUrl = (url: string | undefined): string => {
    if (!url) return placeholderImage

    try {
      // Handle relative URLs from the metadata API
      if (url.startsWith("/")) {
        return `https://secure-metadata-api-beeish.vercel.app${url}`
      }

      // Handle IPFS URLs - use dedicated Pinata gateway for better performance
      if (url.startsWith("ipfs://")) {
        const cid = url.replace("ipfs://", "")
        return `https://beeishxyz.mypinata.cloud/ipfs/${cid}`
      }

      // Convert HTTP to HTTPS if needed
      if (url.startsWith("http://")) {
        return url.replace("http://", "https://")
      }

      // Return the URL as is if it's already HTTPS or another format
      return url
    } catch (error) {
      console.error("Error validating image URL:", error)
      return placeholderImage
    }
  }

  useEffect(() => {
    // If we have initialMetadata, use it
    if (initialMetadata) {
      setMetadata(initialMetadata)
      setIsLoading(false)
      return
    }

    const fetchMetadata = async () => {
      try {
        setIsLoading(true)
        setImageError(false)
        setMetadataError(null)

        // Use the API URL directly
        const metadataUrl = `https://secure-metadata-api-beeish.vercel.app/metadata/${tokenId}`

        // Fetch the metadata
        const response = await fetch(metadataUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.statusText}`)
        }

        const data = await response.json()
        if (!data.image) {
          console.warn(`No image URL found for token ${tokenId}`)
        }
        setMetadata(data)

        // Notify parent if callback exists
        if (onMetadataUpdate) {
          onMetadataUpdate(tokenId, data)
        }
      } catch (err: any) {
        console.error(`Error fetching NFT metadata for token ${tokenId}:`, err)
        setMetadataError(err.message || "Failed to load NFT metadata")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetadata()
  }, [tokenId, initialMetadata, onMetadataUpdate])

  // Update metadata if initialMetadata changes
  useEffect(() => {
    if (initialMetadata) {
      setMetadata(initialMetadata)
      setIsLoading(false)
    }
  }, [initialMetadata])

  const handleImageError = () => {
    console.error(`Error loading image for token ${tokenId} from URL: ${metadata?.image || "undefined"}`)
    setImageError(true)
  }

  const openModal = () => {
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  // Handle successful reveal
  const handleRevealSuccess = (tokenId: number, newMetadata: any) => {
    setMetadata(newMetadata)

    // Notify parent if callback exists
    if (onMetadataUpdate) {
      onMetadataUpdate(tokenId, newMetadata)
    }
  }

  // Get the validated image URL
  const imageUrl = metadata?.image ? validateImageUrl(metadata.image) : placeholderImage

  // Check if this NFT has animation
  const hasAnimation = !!metadata?.animation_url

  return (
    <>
      <div
        className="bg-amber-100 border border-amber-500 rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow duration-300 cursor-pointer hover:scale-105 transition-transform"
        onClick={openModal}
      >
        <div className="relative w-full aspect-square bg-amber-200">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
            </div>
          ) : metadataError || imageError ? (
            <div className="relative h-full w-full">
              <div className="absolute inset-0 flex items-center justify-center bg-amber-200">
                <span className="text-amber-800 font-bold text-lg">#{tokenId}</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-0.5 text-center truncate">
                Error
              </div>
            </div>
          ) : (
            <div className="relative h-full w-full">
              <div className="absolute inset-0 bg-amber-200 flex items-center justify-center">
                <span className="text-amber-800 font-bold text-lg">#{tokenId}</span>
              </div>
              <Image
                src={imageUrl || "/placeholder.svg"}
                alt={metadata?.name || `Bee-ish NFT #${tokenId}`}
                fill
                className="object-cover"
                onError={handleImageError}
                priority={false}
                unoptimized={true}
              />
              {/* Removed the Animated tag that was here */}
            </div>
          )}
        </div>
        <div className="p-2 bg-amber-200">
          <h3 className="text-xs font-bold text-brown-600 text-center truncate">
            {metadata?.name || `Bee-ish #${tokenId}`}
          </h3>
        </div>
      </div>

      {/* Detail Modal */}
      {isModalOpen && (
        <NFTDetailModal
          isOpen={isModalOpen}
          onClose={closeModal}
          tokenId={tokenId}
          metadata={metadata}
          onRevealSuccess={handleRevealSuccess}
        />
      )}
    </>
  )
}
