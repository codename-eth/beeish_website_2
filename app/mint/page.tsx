"use client"

import { useState, useEffect } from "react"
import Header from "@/components/header"
import SocialFooter from "@/components/social-footer"
import Image from "next/image"
import { Toaster } from "@/components/ui/toaster"
import MintButton from "@/components/mint-button"
import { switchToAbstractNetwork } from "@/lib/wallet-utils"
import { useToast } from "@/hooks/use-toast"
import { useAccount, useDisconnect, useChainId } from "wagmi"
import { useLoginWithAbstract } from "@abstract-foundation/agw-react"
import { useWalletContext } from "@/app/providers"

export default function MintPage() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Use the global wallet context
  const { walletType, setWalletType, isAbstractNetwork, setIsAbstractNetwork } = useWalletContext()

  // Wagmi hooks
  const { address, isConnected, connector } = useAccount()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { login: abstractLogin, isLoggedIn: isAbstractLoggedIn } = useLoginWithAbstract()

  // Debug logging
  useEffect(() => {
    console.log("Mint page state:", {
      walletType,
      isAbstractNetwork,
      isConnected,
      address,
      chainId,
    })
  }, [walletType, isAbstractNetwork, isConnected, address, chainId])

  // Check if on Abstract network based on chainId
  useEffect(() => {
    if (chainId === 2741 || isAbstractLoggedIn) {
      // Abstract Chain ID is 2741
      setIsAbstractNetwork(true)
    }
  }, [chainId, isAbstractLoggedIn, setIsAbstractNetwork])

  // Update wallet type when connection changes
  useEffect(() => {
    // If connected via wagmi, update local state
    if (isConnected && address) {
      console.log("Mint page: Connected via wagmi", { address, chainId })

      // Determine wallet type
      const connectorName = connector?.name?.toLowerCase() || ""
      const detectedWalletType = isAbstractLoggedIn || connectorName.includes("abstract") ? "abstract" : "metamask"

      // Update wallet type if not already set
      if (!walletType) {
        setWalletType(detectedWalletType)
      }

      // Check if on Abstract network
      if (chainId === 2741 || isAbstractLoggedIn) {
        setIsAbstractNetwork(true)
      }
    } else if (isAbstractLoggedIn) {
      // If connected via Abstract SDK but not detected by wagmi
      console.log("Mint page: Connected via Abstract SDK")
      if (!walletType) {
        setWalletType("abstract")
      }
      setIsAbstractNetwork(true)
    }
  }, [isConnected, address, chainId, walletType, connector, isAbstractLoggedIn, setWalletType, setIsAbstractNetwork])

  // Handle wallet connection
  const handleConnect = async (type: string) => {
    console.log("handleConnect called with type:", type)

    if (type === "disconnect") {
      disconnect()
      setWalletType(null)
      setIsAbstractNetwork(false)
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      if (type === "abstract") {
        // Connect to Abstract wallet using the SDK
        console.log("Connecting to Abstract wallet using SDK...")
        await abstractLogin()
        setWalletType("abstract")
        setIsAbstractNetwork(true)

        // Remove these lines
        // toast({
        //   title: "Connected to Abstract",
        //   description: "Successfully connected to Abstract wallet",
        // });
      } else if (type === "metamask") {
        // MetaMask connection is handled by wagmi in the Header component
        setWalletType("metamask")

        // Check if on Abstract network
        if (chainId !== 2741) {
          try {
            await switchToAbstractNetwork()
            setIsAbstractNetwork(true)
            // Remove these lines
            // toast({
            //   title: "Network Switched",
            //   description: "Successfully switched to Abstract Chain Network",
            // });
          } catch (networkError: any) {
            console.error("Network switching error:", networkError)
            toast({
              title: "Network Switch Failed",
              description: networkError.message || "Failed to switch to Abstract Chain",
              variant: "destructive",
            })
          }
        } else {
          setIsAbstractNetwork(true)
        }
      }
    } catch (error: any) {
      console.error("Connection error:", error)
      setError(error.message || "Failed to connect wallet")
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <>
      <Header />

      <div className="min-h-screen bg-amber-400">
        <div className="relative w-full h-full min-h-screen">
          <Image src="/background.png" alt="Forest landscape" fill priority className="object-cover" />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 overflow-auto">
            <div style={{ paddingLeft: "16px", paddingRight: "16px" }} className="w-full">
              <div className="max-w-7xl mx-auto">
                {/* Mint Section */}
                <div className="w-full max-w-md mx-auto bg-[#FCB74C] border-amber-500 rounded-xl shadow-lg p-6 mb-8 flex flex-col items-center">
                  <h2 className="text-2xl font-bold text-center mb-6">Mint Your Bee-ish NFT</h2>
                  <MintButton account={address} isAbstractNetwork={isAbstractNetwork} walletType={walletType} />

                  <div className="mt-6 text-center">
                    <p className="text-gray-700 mb-4">Price: 0.004 ETH per NFT</p>
                    <p className="text-gray-700 mb-4">Max 100 NFTs per transaction</p>
                  </div>
                </div>

                {/* Removed the wallet connected box that was here */}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SocialFooter />
      <Toaster />
    </>
  )
}
