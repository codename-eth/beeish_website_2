"use client"

import { useAccount, useBalance } from "wagmi"
import { motion } from "framer-motion"
import { ConnectButton } from "./connect-button"
import { useEffect, useState } from "react"

interface WalletCardProps {
  className?: string
}

export function WalletCard({ className }: WalletCardProps) {
  const { address, isConnected } = useAccount()
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance({
    address,
    enabled: !!address && isConnected,
    refetchInterval: 10000, // Refetch every 10 seconds
  })

  const [formattedBalance, setFormattedBalance] = useState<string>("")

  useEffect(() => {
    if (balanceData) {
      // Format to 4 decimal places
      const formatted = Number.parseFloat(balanceData.formatted).toFixed(4)
      setFormattedBalance(`${formatted} ${balanceData.symbol}`)
    } else {
      setFormattedBalance("")
    }
  }, [balanceData])

  return (
    <motion.div
      className={`bg-white rounded-xl shadow-md p-6 w-full max-w-md ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-center text-slate-800">Wallet Connection</h2>

        <div className="flex flex-col items-center gap-4 py-4">
          {!isConnected ? (
            <p className="text-slate-600 text-center">Connect your wallet using AGW</p>
          ) : (
            <div className="flex flex-col items-center gap-3 mb-2 w-full">
              <div className="flex items-center justify-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span>
                <span className="text-sm font-medium text-green-600">Connected</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg w-full text-center">
                <span className="text-sm font-medium text-slate-600 block mb-1">Balance</span>
                {isBalanceLoading ? (
                  <div className="flex justify-center items-center h-6">
                    <div className="h-4 w-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <span className="text-lg font-medium">{formattedBalance || "0.0000"}</span>
                )}
              </div>
            </div>
          )}
          <ConnectButton />
        </div>
      </div>
    </motion.div>
  )
}
