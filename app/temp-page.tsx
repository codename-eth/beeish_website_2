"use client"

import { WalletCard } from "@/components/wallet/wallet-card"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-amber-50">
      <div className="max-w-md w-full mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-center mb-6">Abstract Global Wallet Connection</h1>
        <WalletCard />
      </div>
    </main>
  )
}
