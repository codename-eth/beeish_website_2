"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import Header from "@/components/header"
import SocialFooter from "@/components/social-footer"
import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi"
import { switchToAbstractNetwork } from "@/lib/wallet-utils"
import { useLoginWithAbstract } from "@abstract-foundation/agw-react"
import { useWalletContext } from "@/app/providers"
import MintButton from "@/components/mint-button"
import TokenIdNFTs from "@/components/token-id-nfts"
import { Loader2 } from "lucide-react"
import { ethers } from "ethers"
import { BEEISH_CONTRACT_ABI, BEEISH_CONTRACT_ADDRESS } from "@/lib/contract-abi"
import WalletDialog from "@/components/wallet-dialog"

type ActiveView = "main" | "mint" | "reveal"

export default function Home() {
  // State to track which view is active
  const [activeView, setActiveView] = useState<ActiveView>("main")

  // Shared state
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageLoadError, setImageLoadError] = useState(false)
  const { toast } = useToast()

  // Use the global wallet context
  const { walletType, setWalletType, isAbstractNetwork, setIsAbstractNetwork } = useWalletContext()

  // Wagmi hooks
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { login: abstractLogin, isLoggedIn: isAbstractLoggedIn } = useLoginWithAbstract()

  // Reveal page specific state
  const [isLoadingWalletNFTs, setIsLoadingWalletNFTs] = useState(false)
  const [walletError, setWalletError] = useState<string | null>(null)
  const [lookupTokenIds, setLookupTokenIds] = useState<number[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Debug logging
  useEffect(() => {
    console.log("Main page state:", {
      activeView,
      walletType,
      isAbstractNetwork,
      isConnected,
      address,
      isAbstractLoggedIn,
      chainId,
    })
  }, [activeView, walletType, isAbstractNetwork, isConnected, address, isAbstractLoggedIn, chainId])

  // Auto-fetch NFTs when wallet is connected and reveal view is active
  useEffect(() => {
    if (activeView === "reveal" && address && isConnected) {
      console.log("Wallet connected, fetching NFTs automatically")
      setIsLoadingWalletNFTs(true)
      fetchWalletNFTs()
    }
  }, [address, isConnected, activeView])

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

        // If we get here, the connection was successful
        setWalletType("abstract")

        // Immediately set network as abstract for Abstract wallet
        console.log("Setting Abstract network to true in handleConnect")
        setIsAbstractNetwork(true)
      } else {
        // For non-Abstract wallets, check and switch to Abstract network if needed
        const chainId = await window.ethereum?.request({ method: "eth_chainId" })
        // Abstract Chain ID (replace with actual value if different)
        setIsAbstractNetwork(chainId === "0xab5") // Using the correct Abstract Chain ID

        if (!isAbstractNetwork) {
          await switchToAbstractNetwork()
          setIsAbstractNetwork(true)
        }
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

  const handleImageError = () => {
    setImageLoadError(true)
    console.error("Failed to load background image")
  }

  // Fetch wallet NFTs for the reveal view
  const fetchWalletNFTs = async () => {
    setIsLoadingWalletNFTs(true)
    setWalletError(null)

    try {
      // Use connected address
      const walletAddress = address

      // Validate the wallet address
      if (!walletAddress?.trim()) {
        throw new Error("Please connect your wallet")
      }

      // Check if the address is a valid Ethereum address
      if (!ethers.isAddress(walletAddress)) {
        throw new Error("Invalid wallet address format")
      }

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
        // Set the lookupTokenIds to display the NFTs
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

  // Navigation handlers
  const navigateToMain = () => setActiveView("main")
  const navigateToMint = () => setActiveView("mint")
  const navigateToReveal = () => setActiveView("reveal")

  // Custom header with navigation handlers
  const CustomHeader = () => <Header onNavigate={(view: ActiveView) => setActiveView(view)} activeView={activeView} />

  return (
    <div className="flex flex-col min-h-screen">
      {/* Background Image */}
      <div className="fixed inset-0 z-0 bg-amber-100">
        {!imageLoadError ? (
          <Image
            src="/background.png"
            alt="Background"
            fill
            style={{ objectFit: "cover" }}
            priority
            onError={handleImageError}
            unoptimized={true}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-amber-200 to-amber-100"></div>
        )}
      </div>

      {/* Header with navigation */}
      <CustomHeader />

      {/* Main Content */}
      <main className="flex-grow flex relative z-10 px-4">
        <div
          className="w-full flex items-center justify-center"
          style={{ minHeight: "calc(100vh - 120px)", marginTop: "60px" }}
        >
          {/* Main View */}
          {activeView === "main" && (
            <div className="relative w-[756px] h-[227px] max-w-full mx-auto">
              {imageLoadError ? (
                <div className="w-full h-full flex items-center justify-center">
                  <h1 className="text-4xl md:text-6xl font-bold text-amber-800">Beeish</h1>
                </div>
              ) : (
                <Image
                  src="/beeish-logo.png"
                  alt="Bee-ish Logo"
                  width={840}
                  height={252}
                  style={{ objectFit: "contain" }}
                  className="drop-shadow-xl"
                  onError={() => setImageLoadError(true)}
                  unoptimized={true}
                />
              )}
            </div>
          )}

          {/* Mint View */}
          {activeView === "mint" && (
            <div className="w-full max-w-md mx-auto">
              <div className="w-full max-w-md mx-auto bg-[#FCB74C] border-amber-500 rounded-xl shadow-lg p-6 mb-8 flex flex-col items-center">
                <h2 className="text-2xl font-bold text-center mb-6">Mint Your Bee-ish NFT</h2>
                <MintButton account={address} isAbstractNetwork={isAbstractNetwork} walletType={walletType} />

                <div className="mt-6 text-center">
                  <p className="text-gray-700 mb-4">Price: 0.004 ETH per NFT</p>
                  <p className="text-gray-700 mb-4">Max 100 NFTs per transaction</p>
                </div>
              </div>
            </div>
          )}

          {/* Reveal View */}
          {activeView === "reveal" && (
            <div className="w-full mx-auto">
              {/* Show different UI based on wallet connection status */}
              {!isConnected ? (
                // Not connected - show connect wallet prompt
                <div className="bg-[#FCB74C] rounded-xl shadow-md px-6 py-8 mb-4 w-full max-w-md mx-auto flex flex-col items-center">
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
                <div className="bg-[#FCB74C] rounded-xl shadow-md px-6 py-8 mb-4 w-full max-w-md mx-auto flex flex-col items-center">
                  <Loader2 className="h-12 w-12 animate-spin text-amber-600 mb-4" />
                  <p className="text-lg text-gray-700">Fetching your Bee-ish NFTs...</p>
                </div>
              ) : walletError ? (
                // Error fetching NFTs
                <div className="bg-[#FCB74C] rounded-xl shadow-md px-6 py-8 mb-4 w-full max-w-md mx-auto flex flex-col items-center">
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 max-w-md w-full">
                    <p className="font-bold">Error</p>
                    <p>{walletError}</p>
                  </div>
                  <button
                    onClick={fetchWalletNFTs}
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
                <div className="bg-[#FCB74C] rounded-xl shadow-md px-6 py-4 w-full max-w-7xl mx-auto">
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
          )}
        </div>
      </main>

      {/* Footer */}
      <SocialFooter />

      {/* Wallet Connection Dialog */}
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
    </div>
  )
}
