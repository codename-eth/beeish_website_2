"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface WalletOption {
  id: string
  name: string
  icon: string
  buttonImage?: string
  description: string
  installed: boolean
}

interface WalletSelectorProps {
  onConnect: (walletType: string) => void
  isConnecting: boolean
  connectingWallet?: string | null
  availableWallets?: {
    metamask: boolean
    abstract: boolean
    walletconnect?: boolean
    coinbase?: boolean
  }
  className?: string
}

export default function WalletSelector({
  onConnect,
  isConnecting,
  connectingWallet,
  availableWallets = { metamask: true, abstract: true },
  className,
}: WalletSelectorProps) {
  const [wallets, setWallets] = useState<WalletOption[]>([])
  const [hoveredWallet, setHoveredWallet] = useState<string | null>(null)

  // Detect available wallets
  useEffect(() => {
    const walletOptions: WalletOption[] = [
      {
        id: "metamask",
        name: "MetaMask",
        icon: "/metamask-fox-logo.png",
        buttonImage: "/metamask-wallet-button.png",
        description: "Connect to your MetaMask wallet",
        installed: availableWallets.metamask,
      },
      {
        id: "abstract",
        name: "Abstract Wallet",
        icon: "/abstract-wallet-logo.png",
        buttonImage: "/abstract-wallet-button.png",
        description: "Connect to Abstract Global Wallet",
        installed: true, // Always available
      },
    ]

    // Add WalletConnect if available
    if (availableWallets.walletconnect) {
      walletOptions.push({
        id: "walletconnect",
        name: "WalletConnect",
        icon: "/placeholder-xu93m.png",
        description: "Connect with WalletConnect",
        installed: true,
      })
    }

    // Add Coinbase Wallet if available
    if (availableWallets.coinbase) {
      walletOptions.push({
        id: "coinbase",
        name: "Coinbase Wallet",
        icon: "/coinbase-wallet-logo.png",
        description: "Connect to Coinbase Wallet",
        installed: true,
      })
    }

    setWallets(walletOptions)
  }, [availableWallets])

  const handleConnect = (walletId: string) => {
    onConnect(walletId)
  }

  // Check if a specific wallet is connecting
  const isWalletConnecting = (walletId: string) => {
    return isConnecting && connectingWallet === walletId
  }

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <div className="space-y-6">
        {wallets.map((wallet) => (
          <div
            key={wallet.id}
            className={cn(
              "flex flex-col items-center p-4 rounded-lg transition-colors",
              !wallet.installed && "opacity-50 cursor-not-allowed",
            )}
            onMouseEnter={() => setHoveredWallet(wallet.id)}
            onMouseLeave={() => setHoveredWallet(null)}
          >
            <div className="flex items-center mb-3">
              <div className="relative h-12 w-12 flex-shrink-0 mr-3">
                <Image
                  src={wallet.icon || "/placeholder.svg"}
                  alt={`${wallet.name} logo`}
                  fill
                  className="object-contain"
                  unoptimized={wallet.icon.startsWith("/placeholder")}
                />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{wallet.name}</h3>
                <p className="text-sm text-gray-500">{wallet.description}</p>
                {!wallet.installed && <span className="text-xs text-red-500 mt-1 block">Not installed</span>}
              </div>
            </div>

            {wallet.buttonImage ? (
              <button
                onClick={() => wallet.installed && handleConnect(wallet.id)}
                disabled={!wallet.installed || isConnecting}
                className={cn(
                  "relative w-full h-14 transition-transform",
                  hoveredWallet === wallet.id && "transform scale-105",
                  !wallet.installed && "opacity-50 cursor-not-allowed",
                )}
                aria-label={`Connect to ${wallet.name}`}
              >
                <Image
                  src={wallet.buttonImage || "/placeholder.svg"}
                  alt={`Connect to ${wallet.name}`}
                  fill
                  className="object-contain"
                />
                {isWalletConnecting(wallet.id) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </button>
            ) : (
              <Button
                onClick={() => wallet.installed && handleConnect(wallet.id)}
                disabled={!wallet.installed || isConnecting}
                className="w-full"
              >
                {isWalletConnecting(wallet.id) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  `Connect to ${wallet.name}`
                )}
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 text-center text-xs text-gray-500">
        <p>
          By connecting your wallet, you agree to our{" "}
          <a href="#" className="text-amber-600 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-amber-600 hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  )
}
