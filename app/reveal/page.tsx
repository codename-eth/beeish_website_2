"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import TokenIdNFTs from "@/components/token-id-nfts"
import { Toaster } from "@/components/ui/toaster"
import Header from "@/components/header"
import SocialFooter from "@/components/social-footer"
import { useToast } from "@/hooks/use-toast"
import { ethers } from "ethers"
import { BEEISH_CONTRACT_ABI, BEEISH_CONTRACT_ADDRESS } from "@/lib/contract-abi"
import { useAccount, useDisconnect, useChainId } from "wagmi"
import { useLoginWithAbstract } from "@abstract-foundation/agw-react"
import { useWalletContext } from "@/app/providers"
import WalletDialog from "@/components/wallet-dialog"

export default function RevealPage() {
  const [tokenIdInput, setTokenIdInput] = useState("")
  const [lookupTokenIds, setLookupTokenIds] = useState<number[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [walletAddressInput, setWalletAddressInput] = useState("")
  const [isLoadingWalletNFTs, setIsLoadingWalletNFTs] = useState(false)
  const [walletError, setWalletError] = useState<string | null>(null)
  const [walletNFTsMode, setWalletNFTsMode] = useState(false)
  const [currentWalletAddress, setCurrentWalletAddress] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Use the global wallet context
  const { walletType, setWalletType, isAbstractNetwork, setIsAbstractNetwork } = useWalletContext()

  // Wallet connection state
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Wagmi hooks
  const { address, isConnected, connector } = useAccount()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { login: abstractLogin, isLoggedIn: isAbstractLoggedIn } = useLoginWithAbstract()

  // Debug logging
  useEffect(() => {
    console.log("Reveal page state:", {
      walletType,
      isAbstractNetwork,
      isConnected,
      address,
      chainId,
    })
  }, [walletType, isAbstractNetwork, isConnected, address, chainId])

  // Update wallet address input when account changes
  useEffect(() => {
    if (address) {
      setWalletAddressInput(address)
    }
  }, [address])

  // Update wallet type when connection changes
  useEffect(() => {
    // If connected via wagmi, update local state
    if (isConnected && address) {
      console.log("Reveal page: Connected via wagmi", { address, chainId })

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
      console.log("Reveal page: Connected via Abstract SDK")
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
      } else if (type === "metamask") {
        // MetaMask connection is handled by wagmi
        setWalletType("metamask")
      }

      toast({
        title: "Wallet Connected",
        description: `Successfully connected to ${type === "abstract" ? "Abstract" : "MetaMask"} wallet`,
      })
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

  // Auto-fetch NFTs when wallet is connected
  useEffect(() => {
    if (address && isConnected) {
      console.log("Wallet connected, fetching NFTs automatically")
      setIsLoadingWalletNFTs(true)
      fetchWalletNFTs(null, address)
    }
  }, [address, isConnected])

  const fetchWalletNFTs = async (e: React.FormEvent | null, addressOverride?: string) => {
    if (e) e.preventDefault()

    setIsLoadingWalletNFTs(true)
    setWalletError(null)
    setValidationError(null)
    setWalletNFTsMode(false)
    setCurrentWalletAddress(null)

    try {
      // Use provided address or input value
      const walletAddress = addressOverride || walletAddressInput || address

      // Validate the wallet address
      if (!walletAddress?.trim()) {
        throw new Error("Please enter a wallet address")
      }

      // Check if the address is a valid Ethereum address
      if (!ethers.isAddress(walletAddress)) {
        throw new Error("Invalid wallet address format")
      }

      // Switch to wallet NFTs mode
      setWalletNFTsMode(true)
      setCurrentWalletAddress(walletAddress)

      // Create a provider for Abstract Chain
      const provider = new ethers.JsonRpcProvider("https://api.mainnet.abs.xyz")

      // Create a contract instance
      const contract = new ethers.Contract(BEEISH_CONTRACT_ADDRESS, BEEISH_CONTRACT_ABI, provider)

      // Call the tokensOfOwner function to get all NFTs owned by the wallet
      const tokens = await contract.tokensOfOwner(walletAddress)

      // Convert BigNumber array to number array
      const tokenIdNumbers = tokens.map((token: bigint) => Number(token))

      if (tokenIdNumbers.length === 0) {
        console.log("No NFTs found for this wallet")
        // Don't show an error toast, just set empty array
        setLookupTokenIds([])
      } else {
        // Format the token IDs as a comma-separated string
        const tokenIdString = tokenIdNumbers.join(", ")

        // Set the token ID input field with the found token IDs
        setTokenIdInput(tokenIdString)

        // Also set the lookupTokenIds to display the NFTs immediately
        setLookupTokenIds(tokenIdNumbers)
      }
    } catch (err: any) {
      console.error("Error fetching wallet NFTs:", err.message || "Unknown error")
      setWalletError(err.message || "Failed to fetch NFTs for this wallet")
      toast({
        title: "Error",
        description: err.message || "Failed to fetch NFTs for this wallet",
        variant: "destructive",
      })
    } finally {
      setIsLoadingWalletNFTs(false)
    }
  }

  const handleTokenIdSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsValidating(true)
    setValidationError(null)
    setWalletNFTsMode(false)
    setCurrentWalletAddress(null)

    try {
      // Validate the token ID input
      if (!tokenIdInput.trim()) {
        throw new Error("Please enter at least one token ID")
      }

      // Parse the input - accept comma-separated values, spaces, or new lines
      const tokenIdStrings = tokenIdInput
        .split(/[\s,]+/) // Split by commas, spaces, or new lines
        .filter((id) => id.trim() !== "") // Remove empty entries

      if (tokenIdStrings.length === 0) {
        throw new Error("Please enter at least one valid token ID")
      }

      // Convert to numbers and validate
      const tokenIds: number[] = []
      for (const idStr of tokenIdStrings) {
        const id = Number.parseInt(idStr.trim(), 10)
        if (isNaN(id) || id < 0) {
          throw new Error(`Invalid token ID: ${idStr}`)
        }
        tokenIds.push(id)
      }

      // Set the lookup token IDs
      setLookupTokenIds(tokenIds)
    } catch (err: any) {
      console.error("Validation error:", err.message || "Unknown error")
      setValidationError(err.message || "Invalid token ID input")
    } finally {
      setIsValidating(false)
    }
  }

  const resetWalletView = () => {
    setWalletNFTsMode(false)
    setCurrentWalletAddress(null)
  }

  return (
    <>
      <Header />

      <div className="min-h-screen bg-amber-400">
        <div className="relative w-full h-full min-h-screen">
          <Image src="/background.png" alt="Forest landscape" fill priority className="object-cover" />
          <div className="absolute inset-0 flex flex-col items-center pt-24 bg-black/30 overflow-auto">
            <div style={{ paddingLeft: "16px", paddingRight: "16px" }} className="w-full mx-auto">
              {/* Show different UI based on wallet connection status */}
              {!isConnected ? (
                // Not connected - show connect wallet prompt
                <div className="bg-[#FCB74C] rounded-xl shadow-md px-6 py-8 mb-4 w-full flex flex-col items-center">
                  <h2 className="text-2xl font-bold text-center mb-6">Connect Your Wallet to View Your Bees</h2>
                  <p className="text-center mb-8 max-w-md">
                    Connect your wallet to automatically see all your Bee-ish NFTs. You'll be able to view and reveal
                    your Hives.
                  </p>
                  <button
                    onClick={() => setIsDialogOpen(true)}
                    className="relative h-16 w-48 group hover:scale-105 transition-transform duration-200"
                  >
                    <div className="relative w-full h-full">
                      <Image src="/connect-button.png" alt="Connect Wallet" fill className="object-contain" />
                    </div>
                  </button>
                </div>
              ) : isLoadingWalletNFTs ? (
                // Connected but loading NFTs
                <div className="bg-[#FCB74C] rounded-xl shadow-md px-6 py-8 mb-4 w-full flex flex-col items-center">
                  <Loader2 className="h-12 w-12 animate-spin text-amber-600 mb-4" />
                  <p className="text-lg text-gray-700">Fetching your Bee-ish NFTs...</p>
                </div>
              ) : walletError ? (
                // Error fetching NFTs
                <div className="bg-[#FCB74C] rounded-xl shadow-md px-6 py-8 mb-4 w-full flex flex-col items-center">
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 max-w-md w-full">
                    <p className="font-bold">Error</p>
                    <p>{walletError}</p>
                  </div>
                  <button
                    onClick={() => fetchWalletNFTs(null, address)}
                    className="relative h-12 w-32 hover:scale-105 transition-transform duration-200"
                  >
                    <div className="relative w-full h-full">
                      <Image src="/connect-button.png" alt="Try Again" fill className="object-contain" />
                      <div className="absolute inset-0 flex items-center justify-center text-gray-900 font-bold">
                        Try Again
                      </div>
                    </div>
                  </button>
                </div>
              ) : (
                // Connected and NFTs loaded - show the NFTs
                <div className="bg-[#FCB74C] rounded-xl shadow-md px-6 py-4 w-full">
                  {lookupTokenIds.length > 0 ? (
                    <TokenIdNFTs tokenIds={lookupTokenIds} />
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-lg font-medium mb-2">No Bee-ish NFTs Found</p>
                      <p className="text-gray-700">You don't own any Bee-ish NFTs in this wallet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <SocialFooter />
      <Toaster />
      <WalletDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConnect={handleConnect}
        isConnecting={isConnecting}
        error={error}
        availableWallets={{
          metamask: true,
          abstract: true,
        }}
      />
    </>
  )
}
