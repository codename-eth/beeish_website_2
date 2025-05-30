"use client"

import { useState } from "react"
import { useLoginWithAbstract } from "@abstract-foundation/agw-react"
import { useAccount, useDisconnect } from "wagmi"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface AbstractWalletConnectorProps {
  onConnect?: (address: string) => void
  onDisconnect?: () => void
  className?: string
}

export function AbstractWalletConnector({ onConnect, onDisconnect, className }: AbstractWalletConnectorProps) {
  const { login } = useLoginWithAbstract()
  const { disconnect } = useDisconnect()
  const { address, isConnected } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const connect = async () => {
    setIsLoading(true)
    try {
      console.log("Connecting to Abstract Global Wallet...")
      await login()

      if (address) {
        onConnect?.(address)
      }
    } catch (err: any) {
      console.error("Error connecting to AGW:", err)
      toast({
        title: "Connection Failed",
        description: err.message || "Failed to connect to Abstract Global Wallet",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectWallet = async () => {
    setIsLoading(true)
    try {
      await disconnect()
      onDisconnect?.()
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from Abstract Global Wallet",
      })
    } catch (err: any) {
      console.error("Error disconnecting from AGW:", err)
      toast({
        title: "Disconnect Failed",
        description: err.message || "Failed to disconnect from Abstract Global Wallet",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={className}>
      <Button onClick={connect} disabled={isLoading} className="w-full">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <div className="relative h-5 w-5 mr-2">
            <Image src="/abstract-wallet-logo.png" alt="Abstract" fill className="object-contain" />
          </div>
        )}
        {isLoading ? "Connecting..." : "Connect Abstract Wallet"}
      </Button>
    </div>
  )
}
