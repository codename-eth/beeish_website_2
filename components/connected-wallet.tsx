"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, LogOut, ExternalLink } from "lucide-react"
import { useState } from "react"
import Image from "next/image"
import { formatAddress } from "@/lib/wallet-utils"

interface ConnectedWalletProps {
  account: string
  walletType: string
  onDisconnect: () => void
  chainId?: string
  chainName?: string
}

export default function ConnectedWallet({
  account,
  walletType,
  onDisconnect,
  chainId = "0xab5",
  chainName = "Abstract Chain",
}: ConnectedWalletProps) {
  const [copied, setCopied] = useState(false)

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getWalletIcon = () => {
    if (walletType.toLowerCase().includes("metamask")) {
      return "/metamask-fox-logo.png"
    } else if (walletType.toLowerCase().includes("abstract")) {
      return "/abstract-wallet-logo.png"
    }
    return "/wallet-icon.png"
  }

  const getExplorerUrl = () => {
    // If on Abstract network, use Abstract explorer
    if (chainId === "0xab5" || chainId === "2741" || chainName.toLowerCase().includes("abstract")) {
      return `https://abscan.org/address/${account}`
    }
    // Otherwise use Etherscan
    return `https://etherscan.io/address/${account}`
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-center space-x-2">
        <div className="relative h-6 w-6">
          <Image src={getWalletIcon() || "/placeholder.svg"} alt={walletType} fill className="object-contain" />
        </div>
        <div className="flex items-center text-green-600">
          <CheckCircle className="h-4 w-4 mr-1" />
          <span className="text-sm">Connected to {walletType}</span>
        </div>
      </div>

      <div className="p-4 bg-amber-100 rounded-lg flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-700 mb-1">Wallet Address</p>
          <p className="font-mono text-sm text-gray-900">{formatAddress(account)}</p>
        </div>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={copyAddress}
            className="h-8 w-8 text-gray-700 hover:text-gray-900"
          >
            {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-700 hover:text-gray-900"
            onClick={() => window.open(getExplorerUrl(), "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-700 mb-1">Network</p>
          <div className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></span>
            <p className="text-sm text-gray-900">{chainName}</p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDisconnect}
          className="flex items-center space-x-1 bg-red-600 hover:bg-red-700"
        >
          <LogOut className="h-4 w-4 mr-1" />
          <span>Disconnect</span>
        </Button>
      </div>
    </div>
  )
}
