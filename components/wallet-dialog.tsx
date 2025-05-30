"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useLoginWithAbstract } from "@abstract-foundation/agw-react"
import { useAccount } from "wagmi"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import Image from "next/image"

interface WalletDialogProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (walletType: string) => void
  isConnecting: boolean
  error: string | null
  availableWallets: {
    metamask: boolean
    abstract: boolean
    walletconnect?: boolean
    coinbase?: boolean
  }
}

export default function WalletDialog({
  isOpen,
  onClose,
  onConnect,
  isConnecting,
  error,
  availableWallets,
}: WalletDialogProps) {
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null)
  const [hoveredWallet, setHoveredWallet] = useState<string | null>(null)
  const { login, isLoggedIn } = useLoginWithAbstract()
  const { address } = useAccount()
  const { toast } = useToast()

  // Auto-close dialog when address is available after Abstract connection
  useEffect(() => {
    if (connectingWallet === "abstract" && (address || isLoggedIn)) {
      // Successfully connected
      setConnectingWallet(null)
      onConnect("abstract")
      onClose()
    }
  }, [address, isLoggedIn, connectingWallet, onClose, onConnect, toast])

  // Handle wallet connection
  const handleWalletConnect = async (walletType: string) => {
    setConnectingWallet(walletType)

    try {
      if (walletType === "abstract") {
        await login()
        // The useEffect above will handle successful connection
      } else {
        // For other wallet types, just pass to parent component
        onConnect(walletType)
        onClose()
      }
    } catch (err: any) {
      console.error(`Error connecting to ${walletType}:`, err)
      setConnectingWallet(null)
      toast({
        title: "Connection Failed",
        description: err.message || `Failed to connect to ${walletType}`,
        variant: "destructive",
      })
    }
  }

  const walletOptions = [
    {
      id: "metamask",
      name: "MetaMask",
      buttonImage: "/metamask-wallet-button.png",
      installed: availableWallets.metamask,
    },
    {
      id: "abstract",
      name: "Abstract",
      buttonImage: "/abstract-wallet-button.png",
      installed: true, // Always available
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-amber-500 border-4 p-0 overflow-hidden min-w-[280px] w-auto">
        <div className="relative">
          {/* Background color swatch */}
          <div className="absolute inset-0 bg-[#FCB74C]" />

          <div className="relative z-10 p-6">
            <div className="space-y-6">
              {walletOptions.map((wallet) => (
                <div
                  key={wallet.id}
                  className="flex flex-col space-y-3"
                  onMouseEnter={() => setHoveredWallet(wallet.id)}
                  onMouseLeave={() => setHoveredWallet(null)}
                >
                  <span className="font-medium text-lg text-gray-900 text-center">{wallet.name}</span>

                  <button
                    onClick={() => wallet.installed && handleWalletConnect(wallet.id)}
                    disabled={!wallet.installed || isConnecting}
                    className={`relative w-full h-14 transition-transform ${
                      hoveredWallet === wallet.id ? "transform scale-105" : ""
                    } ${!wallet.installed ? "opacity-50 cursor-not-allowed" : ""}`}
                    aria-label={`Connect to ${wallet.name}`}
                  >
                    <Image
                      src={wallet.buttonImage || "/placeholder.svg"}
                      alt={`Connect to ${wallet.name}`}
                      fill
                      className="object-contain"
                      unoptimized={true}
                    />
                    {connectingWallet === wallet.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {error && (
              <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded-md text-red-700 text-sm">{error}</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
