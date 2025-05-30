"use client"

import { useState } from "react"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RevealGameProps {
  tokenId: number
  imageUrl: string
  onRevealComplete: () => void
}

export default function RevealGame({ tokenId, imageUrl, onRevealComplete }: RevealGameProps) {
  const [shotsCount, setShotsCount] = useState(0)
  const [isRevealing, setIsRevealing] = useState(false)
  const [currentAnimation, setCurrentAnimation] = useState<string | null>(null)
  const [animationPosition, setAnimationPosition] = useState({ x: 50, y: 50 })
  const [showAnimation, setShowAnimation] = useState(false)
  const { toast } = useToast()

  const totalRequiredShots = 5
  const animationGifs = ["/1reveal.gif", "/2reveal.gif", "/3reveal.gif"]

  // Handle the shoot action
  const handleShoot = () => {
    if (shotsCount >= totalRequiredShots || showAnimation) return

    // Generate random position for the animation
    const randomX = 20 + Math.random() * 60 // Between 20% and 80% of width
    const randomY = 20 + Math.random() * 60 // Between 20% and 80% of height
    setAnimationPosition({ x: randomX, y: randomY })

    // Select a random animation from the three options
    const randomAnimationIndex = Math.floor(Math.random() * animationGifs.length)
    setCurrentAnimation(animationGifs[randomAnimationIndex])

    // Show the animation
    setShowAnimation(true)

    // Play sound effect if needed
    // const shootSound = new Audio('/shoot-sound.mp3')
    // shootSound.play()

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

  // Complete the reveal process
  const completeReveal = async () => {
    setIsRevealing(true)

    try {
      // Simulate API call with a timeout
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Hive Revealed!",
        description: `Your Hive #${tokenId} has been successfully revealed. Refresh to see your new Bee!`,
      })

      // Notify parent component that reveal is complete
      onRevealComplete()
    } catch (error) {
      toast({
        title: "Reveal Failed",
        description: "There was an error revealing your hive. Please try again.",
        variant: "destructive",
      })
      // Reset shots count to allow retry
      setShotsCount(0)
    } finally {
      setIsRevealing(false)
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* Progress indicator */}
      <div className="w-full bg-amber-200 rounded-full h-2.5 mb-4">
        <div
          className="bg-amber-500 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${(shotsCount / totalRequiredShots) * 100}%` }}
        ></div>
      </div>

      {/* Image container with animation overlay */}
      <div className="relative w-full aspect-square bg-amber-100 rounded-lg overflow-hidden mb-4">
        {/* NFT Image */}
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={`Hive #${tokenId}`}
          fill
          className="object-cover"
          unoptimized={true}
          priority={true}
        />

        {/* Animation overlay */}
        {showAnimation && currentAnimation && (
          <div
            className="absolute pointer-events-none z-10"
            style={{
              left: `${animationPosition.x}%`,
              top: `${animationPosition.y}%`,
              transform: "translate(-50%, -50%)",
              width: "100px",
              height: "100px",
            }}
          >
            <Image
              src={currentAnimation || "/placeholder.svg"}
              alt="Slingshot"
              width={100}
              height={100}
              className="object-contain"
              unoptimized={true}
            />
          </div>
        )}

        {/* Overlay when revealing */}
        {isRevealing && (
          <div className="absolute inset-0 bg-amber-500/50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-2" />
              <p className="text-amber-800 font-bold">Revealing your bee...</p>
            </div>
          </div>
        )}
      </div>

      {/* Shoot button */}
      <button
        onClick={handleShoot}
        disabled={shotsCount >= totalRequiredShots || showAnimation || isRevealing}
        className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all ${
          shotsCount >= totalRequiredShots ? "bg-green-500 hover:bg-green-600" : "bg-amber-500 hover:bg-amber-600"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {showAnimation
          ? "Shooting..."
          : shotsCount >= totalRequiredShots
            ? isRevealing
              ? "Revealing..."
              : "Hive Cracked!"
            : "SHOOT!"}
      </button>
    </div>
  )
}
