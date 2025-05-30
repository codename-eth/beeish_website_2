"use client"

import { WalletCard } from "@/components/wallet/wallet-card"
import { ConsoleLogger } from "@/components/console-logger"
import { WalletDetector } from "@/components/wallet-detector"

export default function TestPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-amber-50">
      <h1 className="text-2xl font-bold mb-6">Wallet Connection Test</h1>
      <div className="w-full max-w-md space-y-6">
        <WalletCard />
        <WalletDetector />
        <ConsoleLogger />
      </div>
    </main>
  )
}
