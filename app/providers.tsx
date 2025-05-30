"use client"

import type React from "react"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/theme-provider"
import { config } from "@/lib/wagmi-config"
import { useState, useEffect, createContext, useContext } from "react"
import { AbstractWalletProvider } from "@abstract-foundation/agw-react"
import { abstractTestnet } from "@/lib/wagmi-config"
import { getStoredWalletConnection, storeWalletConnection, clearStoredWalletConnection } from "@/lib/wallet-persistence"

// Create a context for wallet state
interface WalletContextType {
  walletType: string | null
  setWalletType: (type: string | null) => void
  isAbstractNetwork: boolean
  setIsAbstractNetwork: (value: boolean) => void
}

export const WalletContext = createContext<WalletContextType>({
  walletType: null,
  setWalletType: () => {},
  isAbstractNetwork: false,
  setIsAbstractNetwork: () => {},
})

export function useWalletContext() {
  return useContext(WalletContext)
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Create a client with persisted state
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Keep previous data when fetching new data
            staleTime: 1000 * 60 * 5, // 5 minutes
            // Retry failed queries
            retry: 2,
          },
        },
      }),
  )

  // Wallet state with persistence
  const [walletType, setWalletTypeState] = useState<string | null>(null)
  const [isAbstractNetwork, setIsAbstractNetworkState] = useState<boolean>(false)

  // Load wallet state from localStorage on initial render
  useEffect(() => {
    const storedData = getStoredWalletConnection()
    if (storedData) {
      console.log("Restoring wallet connection from storage:", storedData)
      setWalletTypeState(storedData.walletType)
      setIsAbstractNetworkState(storedData.isAbstractNetwork)
    }
  }, [])

  // Add this useEffect to handle auto-reconnection
  useEffect(() => {
    // This effect runs once on initial mount
    const reconnectWallet = async () => {
      const storedData = getStoredWalletConnection()
      if (storedData) {
        console.log("Attempting to reconnect wallet from storage:", storedData)

        // Set the wallet type and network state from storage
        setWalletTypeState(storedData.walletType)
        setIsAbstractNetworkState(storedData.isAbstractNetwork)

        // If it was an Abstract wallet, try to reconnect via the SDK
        if (storedData.walletType === "abstract" && typeof window !== "undefined" && window.abstractGlobalWallet) {
          try {
            // Check if already connected
            const isConnected = await window.abstractGlobalWallet.isConnected()
            if (!isConnected) {
              console.log("Reconnecting to Abstract wallet...")
              await window.abstractGlobalWallet.connect()
            }
          } catch (error) {
            console.error("Failed to reconnect to Abstract wallet:", error)
            // Clear stored data if reconnection fails
            clearStoredWalletConnection()
            setWalletTypeState(null)
            setIsAbstractNetworkState(false)
          }
        }
        // For other wallet types, wagmi's autoConnect will handle reconnection
      }
    }

    reconnectWallet()
  }, [])

  // Wrapper functions to update both state and localStorage
  const setWalletType = (type: string | null) => {
    setWalletTypeState(type)
    if (type === null) {
      clearStoredWalletConnection()
    } else {
      storeWalletConnection(type, isAbstractNetwork)
    }
  }

  const setIsAbstractNetwork = (value: boolean) => {
    setIsAbstractNetworkState(value)
    if (walletType) {
      storeWalletConnection(walletType, value)
    }
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <WalletContext.Provider
            value={{
              walletType,
              setWalletType,
              isAbstractNetwork,
              setIsAbstractNetwork,
            }}
          >
            <AbstractWalletProvider chain={abstractTestnet}>{children}</AbstractWalletProvider>
          </WalletContext.Provider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
