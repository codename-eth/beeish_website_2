"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAccount } from "wagmi"

export function WalletDetector() {
  const { address, isConnected, connector } = useAccount()
  const [walletInfo, setWalletInfo] = useState<Record<string, any>>({})

  useEffect(() => {
    if (typeof window === "undefined") return

    const info: Record<string, any> = {}

    // Check for window.ethereum (for MetaMask)
    if (window.ethereum) {
      info.ethereum = {
        exists: true,
        isMetaMask: window.ethereum.isMetaMask || false,
      }
    } else {
      info.ethereum = { exists: false }
    }

    // Check for Abstract Global Wallet
    info.abstract = {
      // Check if AGW is available
      hasAGW: typeof window.abstractGlobalWallet !== "undefined",
      // Check if we're connected via wagmi
      isConnected: isConnected,
      address: address,
      connector: connector?.name || "None",
    }

    setWalletInfo(info)
  }, [isConnected, address, connector])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Wallet Detection</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xs font-mono bg-slate-100 p-3 rounded-md overflow-auto max-h-60">
          <pre>{JSON.stringify(walletInfo, null, 2)}</pre>
        </div>
      </CardContent>
    </Card>
  )
}
