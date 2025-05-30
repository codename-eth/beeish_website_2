"use client"

import { useEffect, useState } from "react"
import { CheckCircle, XCircle } from "lucide-react"
import { useWalletContext } from "@/app/providers"
import { useAccount, useChainId } from "wagmi"

export function ConnectionStatus() {
  const { walletType, isAbstractNetwork } = useWalletContext()
  const [mounted, setMounted] = useState(false)

  // Use wagmi hooks directly - they're safe in client components
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  // Only show after component has mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed bottom-20 right-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-2 text-xs z-50">
      <div className="flex flex-col space-y-1">
        <div className="flex items-center">
          <span className="font-semibold mr-1">Connection:</span>
          {isConnected ? (
            <span className="flex items-center text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </span>
          ) : (
            <span className="flex items-center text-red-600">
              <XCircle className="h-3 w-3 mr-1" />
              Disconnected
            </span>
          )}
        </div>

        <div className="flex items-center">
          <span className="font-semibold mr-1">Wallet Type:</span>
          <span>{walletType || "None"}</span>
        </div>

        <div className="flex items-center">
          <span className="font-semibold mr-1">Network:</span>
          <span>{isAbstractNetwork ? "Abstract" : chainId ? `Chain ID: ${chainId}` : "Unknown"}</span>
        </div>

        {address && (
          <div className="flex items-center">
            <span className="font-semibold mr-1">Address:</span>
            <span className="font-mono">{`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}</span>
          </div>
        )}
      </div>
    </div>
  )
}
