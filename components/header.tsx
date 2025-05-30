"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { switchToAbstractNetwork } from "@/lib/wallet-utils"
import { Menu, X } from "lucide-react"
import WalletDialog from "@/components/wallet-dialog"
import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi"
import { metaMaskConnector } from "@/lib/wagmi-config"
import { useWalletContext } from "@/app/providers"
import { useLoginWithAbstract } from "@abstract-foundation/agw-react"

interface HeaderProps {
  account?: string | null
  walletType?: string | null
  isConnecting?: boolean
  error?: string | null
  onConnect?: (walletType: string) => void
  isAbstractNetwork?: boolean
  setIsAbstractNetwork?: (value: boolean) => void
  walletAvailable?: boolean
  // Add these new props for navigation
  onNavigate?: (view: "main" | "mint" | "reveal") => void
  activeView?: "main" | "mint" | "reveal"
}

export default function Header({
  account: propAccount,
  walletType: propWalletType,
  isConnecting: propIsConnecting,
  error: propError,
  onConnect: propOnConnect,
  isAbstractNetwork: propIsAbstractNetwork,
  setIsAbstractNetwork: propSetIsAbstractNetwork,
  walletAvailable = true,
  onNavigate,
  activeView,
}: HeaderProps) {
  // Use the global wallet context
  const {
    walletType: contextWalletType,
    setWalletType,
    isAbstractNetwork: contextIsAbstractNetwork,
    setIsAbstractNetwork,
  } = useWalletContext()

  // Use props if provided, otherwise use context
  const walletType = propWalletType !== undefined ? propWalletType : contextWalletType
  const isAbstractNetwork = propIsAbstractNetwork !== undefined ? propIsAbstractNetwork : contextIsAbstractNetwork

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(propIsConnecting || false)
  const [error, setError] = useState<string | null>(propError || null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [isOnAbstractNetwork, setIsOnAbstractNetwork] = useState(false)
  const [imageLoadError, setImageLoadError] = useState({
    beeMascot: false,
    mintButton: false,
    myHiveButton: false,
    connectButton: false,
  })

  // Add wagmi hooks
  const { address, isConnected, connector } = useAccount()
  const { connect, isPending: isConnectPending } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId() // Using useChainId instead of useNetwork
  const { login: abstractLogin, isLoggedIn: isAbstractLoggedIn } = useLoginWithAbstract()

  // Debug logging to help identify issues
  useEffect(() => {
    console.log("Header state:", {
      account: propAccount,
      address,
      walletType,
      isAbstractNetwork,
      isConnected,
      chainId,
    })
  }, [propAccount, walletType, isAbstractNetwork, isConnected, address, chainId])

  // Check if wallets are available
  const [availableWallets, setAvailableWallets] = useState({
    metamask: true,
    abstract: walletAvailable,
  })

  // Update available wallets when walletAvailable changes
  useEffect(() => {
    setAvailableWallets((prev) => ({
      ...prev,
      abstract: walletAvailable,
    }))
  }, [walletAvailable])

  // If wallet type is abstract, always set network as abstract
  useEffect(() => {
    if (walletType === "abstract" && (propAccount || address)) {
      console.log("Setting Abstract network to true because wallet type is abstract")
      if (propSetIsAbstractNetwork) {
        propSetIsAbstractNetwork(true)
      } else {
        setIsAbstractNetwork(true)
      }
    }
  }, [walletType, propAccount, address, propSetIsAbstractNetwork, setIsAbstractNetwork])

  // Check if on Abstract network based on chainId
  useEffect(() => {
    if (chainId === 2741) {
      // Abstract Chain ID is 2741
      setIsOnAbstractNetwork(true)
    }
  }, [chainId])

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Check if we should show the connected state
  // Either when on Abstract network OR when using Abstract wallet
  const isEffectivelyConnected = isAbstractNetwork || walletType === "abstract"

  const handleSwitchNetwork = async () => {
    // If using Abstract wallet, always set network as abstract
    if (walletType === "abstract") {
      console.log("Setting Abstract network to true in handleSwitchNetwork")
      if (propSetIsAbstractNetwork) {
        propSetIsAbstractNetwork(true)
      } else {
        setIsAbstractNetwork(true)
      }
      return
    }

    if (!propAccount && !address) {
      toast({
        title: "Not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    setIsSwitchingNetwork(true)

    try {
      await switchToAbstractNetwork()
      if (propSetIsAbstractNetwork) {
        propSetIsAbstractNetwork(true)
      } else {
        setIsAbstractNetwork(true)
      }
    } catch (error: any) {
      console.error("Error switching network:", error)
      toast({
        title: "Error switching network",
        description: error.message || "Failed to switch to Abstract Chain",
        variant: "destructive",
      })
    } finally {
      setIsSwitchingNetwork(false)
    }
  }

  const handleButtonClick = () => {
    if (!propAccount && !isConnected) {
      // Show wallet selection dialog
      setIsDialogOpen(true)
    } else if (!isEffectivelyConnected) {
      // Only show network switching for non-Abstract wallets that are not on Abstract network
      handleSwitchNetwork()
    } else {
      // If already connected, disconnect
      if (isConnected) {
        disconnect()
        if (propOnConnect) {
          propOnConnect("disconnect")
        } else {
          setWalletType(null)
          setIsAbstractNetwork(false)
        }
      } else if (propOnConnect) {
        propOnConnect("disconnect")
      }
    }
    setIsMobileMenuOpen(false)
  }

  const getButtonImage = () => {
    // For debugging
    console.log("getButtonImage called with:", {
      account: propAccount,
      isConnected,
      isEffectivelyConnected,
      walletType,
      isAbstractNetwork,
    })

    if (!propAccount && !isConnected) {
      return "/connect-button.png"
    } else if (walletType === "abstract" || isAbstractNetwork) {
      // Always show connected for Abstract wallet or when on Abstract network
      return "/connected-button.png"
    } else {
      // For other wallets not on Abstract network
      return "/switch-network-button.png"
    }
  }

  // Get button alt text
  const getButtonAltText = () => {
    if (!propAccount && !isConnected) {
      return "Connect"
    } else if (walletType === "abstract" || isAbstractNetwork) {
      return "Connected"
    } else {
      return "Switch Network"
    }
  }

  // Mobile button style
  const mobileButtonStyle = {
    width: "100%",
    height: "48px",
    position: "relative" as const,
    marginBottom: "12px",
  }

  // Handle wallet connection
  const handleWalletConnect = (walletType: string) => {
    if (walletType === "metamask") {
      connect({ connector: metaMaskConnector })
    } else if (walletType === "abstract") {
      // For Abstract wallet, automatically set network as abstract
      console.log("Setting wallet type to abstract in handleWalletConnect")
      if (propOnConnect) {
        propOnConnect(walletType)
      } else {
        setWalletType(walletType)
        setIsAbstractNetwork(true)
      }
    } else if (propOnConnect) {
      propOnConnect(walletType)
    }
  }

  // Update the useEffect that checks for wallet connection to be more robust
  useEffect(() => {
    // Check if connected via wagmi
    if (isConnected && address) {
      // If connected via wagmi, update the local state
      if (!propAccount) {
        console.log("Connected via wagmi, updating local state", { address, chainId })

        // Determine wallet type based on connector name or other properties
        const connectorName = connector?.name?.toLowerCase() || ""
        const detectedWalletType = connectorName.includes("abstract") ? "abstract" : "metamask"

        // Update wallet type in context if not using props
        if (!propWalletType) {
          setWalletType(detectedWalletType)
        }

        // Check if on Abstract network
        if (chainId === 2741) {
          if (propSetIsAbstractNetwork) {
            propSetIsAbstractNetwork(true)
          } else {
            setIsAbstractNetwork(true)
          }
        }
      }
    } else if (isAbstractLoggedIn) {
      // If connected via Abstract but not detected by wagmi
      console.log("Connected via Abstract SDK, updating local state")
      if (!propWalletType) {
        setWalletType("abstract")
      }
      if (propSetIsAbstractNetwork) {
        propSetIsAbstractNetwork(true)
      } else {
        setIsAbstractNetwork(true)
      }
    }
  }, [
    isConnected,
    address,
    chainId,
    propAccount,
    propWalletType,
    connector,
    isAbstractLoggedIn,
    setWalletType,
    setIsAbstractNetwork,
    propSetIsAbstractNetwork,
  ])

  // Add this useEffect to handle connection state updates
  useEffect(() => {
    // This effect runs when connection state changes
    if (isConnected && address) {
      console.log("Header detected active connection:", { address, chainId })

      // Determine wallet type based on connector
      const connectorName = connector?.name?.toLowerCase() || ""
      const detectedWalletType = connectorName.includes("abstract") || isAbstractLoggedIn ? "abstract" : "metamask"

      // Update wallet type in context if not already set
      if (!walletType) {
        if (propWalletType === undefined) {
          setWalletType(detectedWalletType)
        }
      }

      // Check if on Abstract network
      if (chainId === 2741 || isAbstractLoggedIn) {
        if (propIsAbstractNetwork === undefined) {
          setIsAbstractNetwork(true)
        }
      }
    }
  }, [isConnected, address, chainId, connector, isAbstractLoggedIn])

  // Handle image load errors
  const handleImageError = (imageName: keyof typeof imageLoadError) => {
    setImageLoadError((prev) => ({
      ...prev,
      [imageName]: true,
    }))
    console.error(`Failed to load image: ${imageName}`)
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50" style={{ paddingTop: "16px" }}>
      <div style={{ paddingLeft: "16px", paddingRight: "16px" }} className="w-full">
        <div className="bg-[#FCB74C] rounded-xl shadow-md h-[60px] flex items-center px-6 w-full">
          <div className="flex items-center justify-between w-full">
            {/* Left side - Bee Mascot only */}
            <div className="flex items-center justify-center">
              {/* Bee Mascot */}
              <button onClick={() => onNavigate && onNavigate("main")} className="block">
                <div style={{ width: "48px", height: "48px", position: "relative", overflow: "hidden" }}>
                  {imageLoadError.beeMascot ? (
                    <div className="w-full h-full flex items-center justify-center bg-amber-300 rounded-full">
                      <span className="text-xs text-amber-800">🐝</span>
                    </div>
                  ) : (
                    <Image
                      src="/bee-mascot.png"
                      alt="Bee-ish Mascot"
                      width={48}
                      height={48}
                      onError={() => handleImageError("beeMascot")}
                      className="img_header hover:scale-110 transition-transform duration-200"
                      unoptimized={true}
                    />
                  )}
                </div>
              </button>
            </div>

            {/* Right side - Navigation buttons for desktop */}
            <div className="hidden md:flex items-center justify-end space-x-3 ml-auto">
              {/* Mint Button */}
              <button
                onClick={() => onNavigate && onNavigate("mint")}
                className={`relative w-[120px] h-[48px] ${activeView === "mint" ? "opacity-70" : ""}`}
              >
                <div className="w-full h-full">
                  {imageLoadError.mintButton ? (
                    <div className="w-full h-full flex items-center justify-center bg-amber-500 rounded-full">
                      <span className="font-bold text-white">Mint</span>
                    </div>
                  ) : (
                    <Image
                      src="/mint-button.png"
                      alt="Mint"
                      width={120}
                      height={48}
                      onError={() => handleImageError("mintButton")}
                      className="hover:scale-105 transition-transform duration-200"
                      unoptimized={true}
                    />
                  )}
                </div>
              </button>

              {/* My Hive Button */}
              <button
                onClick={() => onNavigate && onNavigate("reveal")}
                className={`relative w-[120px] h-[48px] ${activeView === "reveal" ? "opacity-70" : ""}`}
              >
                <div className="w-full h-full">
                  {imageLoadError.myHiveButton ? (
                    <div className="w-full h-full flex items-center justify-center bg-amber-500 rounded-full">
                      <span className="font-bold text-white">My Hive</span>
                    </div>
                  ) : (
                    <Image
                      src="/my-hive-button.png"
                      alt="My Hive"
                      width={120}
                      height={48}
                      onError={() => handleImageError("myHiveButton")}
                      className="hover:scale-105 transition-transform duration-200"
                      unoptimized={true}
                    />
                  )}
                </div>
              </button>

              {/* Connect Button */}
              <button
                onClick={handleButtonClick}
                disabled={isConnecting || isConnectPending}
                className="relative w-[120px] h-[48px]"
                aria-label={getButtonAltText()}
              >
                <div className="w-full h-full">
                  {imageLoadError.connectButton ? (
                    <div className="w-full h-full flex items-center justify-center bg-amber-500 rounded-full">
                      <span className="font-bold text-white">{getButtonAltText()}</span>
                    </div>
                  ) : (
                    <Image
                      src={getButtonImage() || "/placeholder.svg"}
                      alt={getButtonAltText()}
                      width={120}
                      height={48}
                      onError={() => handleImageError("connectButton")}
                      className="hover:scale-105 transition-transform duration-200"
                      unoptimized={true}
                    />
                  )}
                  {/* No text displayed when connected */}
                  {(isConnecting || isConnectPending) && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-900 font-bold text-xs">
                      Connecting...
                    </div>
                  )}
                </div>
              </button>
            </div>

            {/* Hamburger menu for mobile */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md hover:bg-amber-500/20"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6 text-gray-900" />
                ) : (
                  <Menu className="h-6 w-6 text-gray-900" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="absolute top-[76px] right-4 bg-[#FCB74C] rounded-xl shadow-lg p-4 w-[200px] md:hidden z-50"
          >
            <div className="flex flex-col items-center">
              {/* Mint Button */}
              <button
                onClick={() => {
                  onNavigate && onNavigate("mint")
                  setIsMobileMenuOpen(false)
                }}
                style={mobileButtonStyle}
                className={activeView === "mint" ? "opacity-70" : ""}
              >
                <div style={{ width: "100%", height: "100%" }}>
                  {imageLoadError.mintButton ? (
                    <div className="w-full h-full flex items-center justify-center bg-amber-500 rounded-full">
                      <span className="font-bold text-white">Mint</span>
                    </div>
                  ) : (
                    <Image
                      src="/mint-button.png"
                      alt="Mint"
                      width={200}
                      height={48}
                      onError={() => handleImageError("mintButton")}
                      className="hover:scale-105 transition-transform duration-200"
                    />
                  )}
                </div>
              </button>

              {/* My Hive Button */}
              <button
                onClick={() => {
                  onNavigate && onNavigate("reveal")
                  setIsMobileMenuOpen(false)
                }}
                style={mobileButtonStyle}
                className={activeView === "reveal" ? "opacity-70" : ""}
              >
                <div style={{ width: "100%", height: "100%" }}>
                  {imageLoadError.myHiveButton ? (
                    <div className="w-full h-full flex items-center justify-center bg-amber-500 rounded-full">
                      <span className="font-bold text-white">My Hive</span>
                    </div>
                  ) : (
                    <Image
                      src="/my-hive-button.png"
                      alt="My Hive"
                      width={200}
                      height={48}
                      onError={() => handleImageError("myHiveButton")}
                      className="hover:scale-105 transition-transform duration-200"
                    />
                  )}
                </div>
              </button>

              {/* Connect Button */}
              <button
                onClick={handleButtonClick}
                style={mobileButtonStyle}
                disabled={isConnecting || isConnectPending}
                aria-label={getButtonAltText()}
              >
                <div style={{ width: "100%", height: "100%" }}>
                  {imageLoadError.connectButton ? (
                    <div className="w-full h-full flex items-center justify-center bg-amber-500 rounded-full">
                      <span className="font-bold text-white">{getButtonAltText()}</span>
                    </div>
                  ) : (
                    <Image
                      src={getButtonImage() || "/placeholder.svg"}
                      alt={getButtonAltText()}
                      width={200}
                      height={48}
                      onError={() => handleImageError("connectButton")}
                      className="hover:scale-105 transition-transform duration-200"
                    />
                  )}
                  {/* No text displayed when connected */}
                  {(isConnecting || isConnectPending) && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-900 font-bold text-xs">
                      Connecting...
                    </div>
                  )}
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Wallet Connection Dialog */}
      <WalletDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConnect={handleWalletConnect}
        isConnecting={isConnecting || isConnectPending}
        error={error}
        availableWallets={availableWallets}
      />
    </div>
  )
}
