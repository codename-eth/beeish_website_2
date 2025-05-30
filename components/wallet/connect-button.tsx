"use client"

import { useState } from "react"
import { useLoginWithAbstract } from "@abstract-foundation/agw-react"
import { useAccount, useDisconnect } from "wagmi"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface ConnectButtonProps {
  className?: string
}

export function ConnectButton({ className }: ConnectButtonProps) {
  const { login } = useLoginWithAbstract()
  const { disconnect } = useDisconnect()
  const { address, isConnected } = useAccount()
  const [isLoading, setIsLoading] = useState(false)

  const handleConnection = async () => {
    try {
      setIsLoading(true)
      if (isConnected) {
        console.log("Attempting to disconnect...")
        await disconnect()
      } else {
        console.log("Attempting to connect...")
        await login()
      }
    } catch (error) {
      console.error("Connection error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button onClick={handleConnection} disabled={isLoading} className={`relative ${className}`} size="lg">
        {isLoading ? (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <svg
              className="h-5 w-5 animate-spin text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </motion.div>
        ) : null}
        <span className={isLoading ? "invisible" : "visible"}>
          {isConnected ? "Disconnect Wallet" : "Connect with AGW"}
        </span>
      </Button>

      {isConnected && address && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-muted-foreground break-all max-w-xs text-center"
        >
          Connected: {address}
        </motion.div>
      )}
    </div>
  )
}
