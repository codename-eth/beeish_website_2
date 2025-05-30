"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Download, Maximize, CheckCircle } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

interface NFTDetailModalProps {
  isOpen: boolean
  onClose: () => void
  tokenId: number
  metadata: any
  onRevealSuccess?: (tokenId: number, newMetadata: any) => void
}

export default function NFTDetailModal({ isOpen, onClose, tokenId, metadata, onRevealSuccess }: NFTDetailModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isRevealing, setIsRevealing] = useState(false)
  const [shotsCount, setShotsCount] = useState(0)
  const [showAnimation, setShowAnimation] = useState(false)
  const [currentAnimation, setCurrentAnimation] = useState<string | null>(null)
  const [animationPosition, setAnimationPosition] = useState({ x: 50, y: 50 })
  const [currentMetadata, setCurrentMetadata] = useState<any>(metadata)
  const [revealSuccess, setRevealSuccess] = useState(false)
  const { toast } = useToast()
  const [revealStarted, setRevealStarted] = useState(false)
  const [showAnimatedContent, setShowAnimatedContent] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [animationError, setAnimationError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const totalRequiredShots = 5
  const animationGifs = ["/1reveal.gif", "/2reveal.gif", "/3reveal.gif"]

  const shotSoundRef = useRef<HTMLAudioElement | null>(null)

  // Placeholder image while loading or if there's an error
  const placeholderImage = `/placeholder.svg?height=500&width=500&query=Bee-ish NFT ${tokenId}`

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

  // Reset states when modal opens or metadata changes
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      setShotsCount(0)
      setIsRevealing(false)
      setShowAnimation(false)
      setRevealSuccess(false)
      setCurrentMetadata(metadata)
      setRevealStarted(false)
      // Only default to animated content if animation_url exists
      setShowAnimatedContent(!!metadata?.animation_url)
      setImageError(false)
      setAnimationError(false)
    }
  }, [isOpen, metadata])

  useEffect(() => {
    // Create audio element for the shot sound
    shotSoundRef.current = new Audio("/shot.mp3")

    // Cleanup function
    return () => {
      if (shotSoundRef.current) {
        shotSoundRef.current.pause()
        shotSoundRef.current.src = ""
      }
    }
  }, [])

  // Add this new useEffect after the existing useEffects
  useEffect(() => {
    // Recalculate URLs whenever metadata changes
    // This ensures revealed NFTs get the proper gateway URLs
  }, [currentMetadata])

  // Move these calculations to be reactive to currentMetadata changes
  // Determine if we have animation content
  const hasAnimationUrl = !!currentMetadata?.animation_url

  // Get the animation URL if available
  const animationUrl = hasAnimationUrl ? validateImageUrl(currentMetadata.animation_url) : null

  // Get the static image URL
  const staticImageUrl = currentMetadata?.image ? validateImageUrl(currentMetadata.image) : placeholderImage

  // Determine the type of animation
  const isGif = animationUrl?.toLowerCase().endsWith(".gif")
  const isVideo = animationUrl?.toLowerCase().match(/\.(mp4|webm|ogg)$/)
  const isHtml =
    animationUrl?.toLowerCase().match(/\.(html|htm)$/) ||
    animationUrl?.includes("data:text/html") ||
    (animationUrl && !isGif && !isVideo)

  // Function to download the image
  const downloadImage = () => {
    const urlToDownload = showAnimatedContent && animationUrl ? animationUrl : staticImageUrl

    if (urlToDownload) {
      const link = document.createElement("a")
      link.href = urlToDownload
      link.download = `beeish-nft-${tokenId}.${urlToDownload.split(".").pop() || "png"}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Toggle between animated and static content
  const toggleContent = () => {
    setShowAnimatedContent(!showAnimatedContent)
  }

  // Check if the NFT is a hive
  const isHive = (): boolean => {
    if (!currentMetadata || !currentMetadata.attributes) return false
    return currentMetadata.attributes.some((attr: any) => attr.trait_type?.toLowerCase() === "hive")
  }

  // Handle shoot button click
  const handleShoot = () => {
    if (shotsCount >= totalRequiredShots || showAnimation) return

    // Set reveal started to true on first click
    if (!revealStarted) {
      setRevealStarted(true)
    }

    // Play the shot sound
    if (shotSoundRef.current) {
      shotSoundRef.current.currentTime = 0
      shotSoundRef.current.play().catch((err) => {
        console.error("Error playing sound:", err)
      })
    }

    // Generate random position for the animation
    const randomX = 20 + Math.random() * 60 // Between 20% and 80% of width
    const randomY = 20 + Math.random() * 60 // Between 20% and 80% of height
    setAnimationPosition({ x: randomX, y: randomY })

    // Select a random animation from the three options
    const randomAnimationIndex = Math.floor(Math.random() * animationGifs.length)
    setCurrentAnimation(animationGifs[randomAnimationIndex])

    // Show the animation
    setShowAnimation(true)

    // Increment shot counter after animation completes
    setTimeout(() => {
      setShotsCount((prev) => prev + 1)
      setShowAnimation(false)

      // Check if we've reached the required number of shots
      if (shotsCount + 1 >= totalRequiredShots) {
        completeReveal()
      }
    }, 1000) // Animation duration
  }

  // Fetch updated metadata after reveal
  const fetchUpdatedMetadata = async () => {
    try {
      const response = await fetch(`https://secure-metadata-api-beeish.vercel.app/metadata/${tokenId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch updated metadata: ${response.statusText}`)
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error fetching updated metadata:", error)
      return null
    }
  }

  // Complete the reveal process
  const completeReveal = async () => {
    setIsRevealing(true)

    try {
      // Call our server-side API route which will handle the passcode securely
      const response = await fetch("/api/reveal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenId: tokenId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `API error: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || "Failed to reveal NFT")
      }

      // Show success message
      toast({
        title: "Hive Revealed!",
        description: `Your Hive #${tokenId} has been successfully revealed to a Bee!`,
      })

      let updatedMetadata = null

      // If the API returned the updated item data, use it directly
      if (result.item) {
        updatedMetadata = result.item
        setCurrentMetadata(result.item)
        setRevealSuccess(true)
      } else {
        // Otherwise fetch the updated metadata
        updatedMetadata = await fetchUpdatedMetadata()

        if (updatedMetadata) {
          // Update the metadata in the modal
          setCurrentMetadata(updatedMetadata)
          setRevealSuccess(true)
        } else {
          // If we couldn't fetch updated metadata, still mark as success
          // but let the user know they need to refresh
          setRevealSuccess(true)
          toast({
            title: "Metadata Update",
            description: "Please refresh the page to see your revealed Bee.",
          })
        }
      }

      // Notify parent component about the successful reveal with the new metadata
      if (updatedMetadata && onRevealSuccess) {
        onRevealSuccess(tokenId, updatedMetadata)
      }
    } catch (error: any) {
      console.error("Reveal API error:", error)
      toast({
        title: "Reveal Failed",
        description: error.message || "There was an error revealing your hive. Please try again.",
        variant: "destructive",
      })
      // Reset shots count to allow retry
      setShotsCount(0)
    } finally {
      setIsRevealing(false)
    }
  }

  const handleImageError = () => {
    setImageError(true)
    console.error(`Failed to load NFT image for token ${tokenId}. URL attempted: ${staticImageUrl}`)
  }

  const handleAnimationError = () => {
    setAnimationError(true)
    console.error(`Failed to load NFT animation for token ${tokenId}. URL attempted: ${animationUrl}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] bg-[#FCB74C] border-4 border-amber-500 p-4 flex flex-col overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between shrink-0 mb-4">
          <DialogTitle className="text-xl font-bold text-brown-600 truncate">
            {currentMetadata?.name || `Bee-ish NFT #${tokenId}`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row gap-4 overflow-hidden h-full">
          {/* Media section - Square container */}
          <div className="lg:w-1/2 flex-shrink-0 overflow-hidden flex items-center justify-center bg-amber-200/50 rounded-lg p-2">
            <div className="relative w-full aspect-square">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
                </div>
              )}

              {/* Show animated content if available and selected */}
              {hasAnimationUrl && showAnimatedContent ? (
                <>
                  {isGif && !animationError && (
                    <div className="absolute inset-0 bg-amber-200 flex items-center justify-center">
                      <span className="text-amber-800 font-bold text-lg">#{tokenId}</span>
                      <Image
                        src={animationUrl || placeholderImage}
                        alt={currentMetadata?.name || `Bee-ish NFT #${tokenId}`}
                        fill
                        className={`object-cover rounded-lg transition-opacity duration-300 ${
                          isLoading ? "opacity-0" : "opacity-100"
                        }`}
                        onLoadingComplete={() => setIsLoading(false)}
                        onError={() => {
                          setIsLoading(false)
                          handleAnimationError()
                        }}
                        unoptimized={true}
                        priority={true}
                      />
                    </div>
                  )}

                  {isVideo && !animationError && (
                    <div className="absolute inset-0 bg-amber-200 flex items-center justify-center">
                      <span className="text-amber-800 font-bold text-lg">#{tokenId}</span>
                      <video
                        ref={videoRef}
                        src={animationUrl}
                        className={`absolute inset-0 w-full h-full object-cover rounded-lg transition-opacity duration-300 ${
                          isLoading ? "opacity-0" : "opacity-100"
                        }`}
                        autoPlay
                        loop
                        muted
                        playsInline
                        controls
                        onLoadedData={() => setIsLoading(false)}
                        onError={() => {
                          setIsLoading(false)
                          handleAnimationError()
                        }}
                      />
                    </div>
                  )}

                  {isHtml && !animationError && (
                    <div className="absolute inset-0 bg-amber-200 flex items-center justify-center">
                      <div className="w-full h-full relative">
                        <iframe
                          src={animationUrl}
                          className="w-full h-full border-0 rounded-lg"
                          sandbox="allow-scripts allow-same-origin"
                          onLoad={() => setIsLoading(false)}
                          onError={() => {
                            setIsLoading(false)
                            handleAnimationError()
                          }}
                          title={`Animation for NFT #${tokenId}`}
                        />
                        <a
                          href={animationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-2 right-2 bg-amber-500/80 hover:bg-amber-500 text-white p-2 rounded-full transition-colors"
                          title="Open in new tab"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Maximize className="h-5 w-5" />
                        </a>
                      </div>
                    </div>
                  )}

                  {animationError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-amber-200 rounded-lg">
                      <div className="text-center p-4">
                        <p className="mb-2 text-amber-800">Failed to load animation</p>
                        <a
                          href={animationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-amber-500 text-white px-4 py-2 rounded-md hover:bg-amber-600 inline-block"
                        >
                          Open in New Tab
                        </a>
                      </div>
                    </div>
                  )}

                  {!isGif && !isVideo && !isHtml && !animationError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-amber-200 rounded-lg">
                      <div className="text-center p-4">
                        <p className="mb-2 text-amber-800">Unknown animation format</p>
                        <a
                          href={animationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-amber-500 text-white px-4 py-2 rounded-md hover:bg-amber-600 inline-block"
                        >
                          Open Animation
                        </a>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // Show static image
                <div className="absolute inset-0 bg-amber-200 flex items-center justify-center">
                  <span className="text-amber-800 font-bold text-lg">#{tokenId}</span>
                  {!imageError ? (
                    <Image
                      src={staticImageUrl || placeholderImage}
                      alt={currentMetadata?.name || `Bee-ish NFT #${tokenId}`}
                      fill
                      className={`object-cover rounded-lg transition-opacity duration-300 ${
                        isLoading ? "opacity-0" : "opacity-100"
                      }`}
                      onLoadingComplete={() => setIsLoading(false)}
                      onError={() => {
                        setIsLoading(false)
                        handleImageError()
                      }}
                      unoptimized={true}
                      priority={true}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-amber-800 font-bold text-xl">Bee-ish #{tokenId}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Animation overlay - Full size */}
              {showAnimation && currentAnimation && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  <Image
                    src={currentAnimation || "/placeholder.svg"}
                    alt="Slingshot"
                    fill
                    className="object-contain"
                    unoptimized={true}
                    onError={() => console.error("Failed to load animation")}
                  />
                </div>
              )}

              {/* Revealing overlay */}
              {isRevealing && (
                <div className="absolute inset-0 bg-amber-500/50 flex items-center justify-center z-20">
                  <div className="bg-white p-4 rounded-lg flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-2" />
                    <p className="text-amber-800 font-bold">Revealing your bee...</p>
                  </div>
                </div>
              )}

              {/* Success overlay */}
              {revealSuccess && (
                <div className="absolute top-2 right-2 bg-green-500 text-white p-2 rounded-full z-20">
                  <CheckCircle className="h-6 w-6" />
                </div>
              )}

              {/* Image controls */}
              {!isLoading && !isRevealing && (
                <div className="absolute bottom-2 right-2 flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      downloadImage()
                    }}
                    className="bg-amber-500/80 hover:bg-amber-500 text-white p-2 rounded-full transition-colors"
                    title="Download image"
                  >
                    <Download className="h-5 w-5" />
                  </button>

                  <a
                    href={showAnimatedContent && animationUrl ? animationUrl : staticImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-amber-500/80 hover:bg-amber-500 text-white p-2 rounded-full transition-colors"
                    title="View full size"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Maximize className="h-5 w-5" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Metadata traits */}
          <div className="lg:w-1/2 flex flex-col overflow-hidden">
            {/* Token ID */}
            <div className="bg-amber-200 p-2 rounded-lg mb-4 shrink-0">
              <p className="text-brown-600 font-medium">Token ID: {tokenId}</p>
            </div>

            {/* Progress bar for hives */}
            {isHive() && shotsCount > 0 && shotsCount < totalRequiredShots && (
              <div className="w-full bg-amber-200 rounded-full h-2.5 mb-4">
                <div
                  className="bg-amber-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${(shotsCount / totalRequiredShots) * 100}%` }}
                ></div>
              </div>
            )}

            {/* Shoot/Reveal button for hives */}
            {isHive() && !revealSuccess && (
              <div className="mb-4 shrink-0">
                <button
                  onClick={handleShoot}
                  disabled={shotsCount >= totalRequiredShots || showAnimation || isRevealing}
                  className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all ${
                    shotsCount >= totalRequiredShots
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-amber-500 hover:bg-amber-600"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {showAnimation
                    ? "Shooting..."
                    : shotsCount >= totalRequiredShots
                      ? isRevealing
                        ? "Revealing..."
                        : "Hive Cracked!"
                      : revealStarted
                        ? "SHOOT!"
                        : "Reveal Hive"}
                </button>
                <p className="text-xs text-center mt-1 text-amber-800">
                  Revealing will transform this Hive into a Bee NFT
                </p>
              </div>
            )}

            {/* Success message after reveal */}
            {revealSuccess && (
              <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="font-bold">Successfully Revealed!</span>
                </div>
                <p className="text-sm mt-1">Your Hive has been transformed into a Bee NFT. Enjoy your new NFT!</p>
              </div>
            )}

            {/* Attributes - scrollable if needed */}
            {currentMetadata?.attributes && currentMetadata.attributes.length > 0 ? (
              <div className="flex-grow overflow-hidden flex flex-col">
                <h3 className="text-lg font-semibold text-brown-600 mb-2 shrink-0">Attributes</h3>
                <div className="overflow-y-auto pr-1 flex-grow">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentMetadata.attributes.map((attr: any, index: number) => (
                      <div key={index} className="bg-amber-200 p-3 rounded-md">
                        <p className="text-sm text-brown-600 font-medium">{attr.trait_type}</p>
                        <p className="text-base font-semibold text-gray-900">{attr.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-200 p-3 rounded-lg text-brown-600 text-center">No attributes available</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
