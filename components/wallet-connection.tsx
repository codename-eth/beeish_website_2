"use client"

import { useAccount, useConnect, useDisconnect } from "wagmi"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { metaMaskConnector } from "@/lib/wagmi-config"
import { AbstractWalletConnector } from "@/components/abstract-wallet-connector"
import Image from "next/image"

export function WalletConnection() {
  const { address, isConnected } = useAccount()
  const { connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [abstractAddress, setAbstractAddress] = useState<string | null>(null)

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      await connect({ connector: metaMaskConnector })
      toast({
        title: "Connected",
        description: "Successfully connected to MetaMask",
      })
    } catch (error: any) {
      console.error("Connection error:", error)
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
      toast({
        title: "Disconnected",
        description: "Your wallet has been disconnected",
      })
    } catch (error: any) {
      console.error("Disconnect error:", error)
      toast({
        title: "Disconnect Failed",
        description: error.message || "Failed to disconnect wallet",
        variant: "destructive",
      })
    }
  }

  // Handle Abstract wallet connection
  const handleAbstractConnect = (addr: string) => {
    setAbstractAddress(addr)
    console.log("Connected to Abstract wallet with address:", addr)
  }

  // Handle Abstract wallet disconnection
  const handleAbstractDisconnect = () => {
    setAbstractAddress(null)
    console.log("Disconnected from Abstract wallet")
  }

  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== "undefined" && window.ethereum && (window.ethereum.isMetaMask || false)

  return (
    <div className="flex flex-col gap-4">
      {isConnected || abstractAddress ? (
        <div className="p-4 border rounded-lg">
          <p className="mb-2">Connected Address:</p>
          <p className="font-mono text-sm break-all">{address || abstractAddress}</p>
          {abstractAddress ? (
            <Button onClick={handleAbstractDisconnect} className="mt-4" variant="destructive">
              Disconnect Abstract
            </Button>
          ) : (
            <Button onClick={handleDisconnect} className="mt-4" variant="destructive">
              Disconnect MetaMask
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleConnect}
            disabled={isPending || isLoading || !isMetaMaskInstalled}
            className="flex gap-2"
          >
            {(isPending || isLoading) && <Loader2 className="h-4 w-4 animate-spin" />}
            <div className="relative h-5 w-5 mr-1">
              <Image src="/metamask-fox-logo.png" alt="MetaMask" fill className="object-contain" />
            </div>
            Connect MetaMask
            {!isMetaMaskInstalled && <span className="text-xs ml-2">(Not installed)</span>}
          </Button>

          <AbstractWalletConnector onConnect={handleAbstractConnect} onDisconnect={handleAbstractDisconnect} />
        </div>
      )}
    </div>
  )
}
