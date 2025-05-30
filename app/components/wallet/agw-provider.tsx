"use client"

import { type ReactNode, createContext, useContext, useState, useEffect } from "react"
import { WagmiConfig, createConfig, configureChains } from "wagmi"
import { abstractTestnet } from "viem/chains"
import { publicProvider } from "wagmi/providers/public"
import { AbstractWalletProvider } from "@abstract-foundation/agw-react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// Create a client
const queryClient = new QueryClient()

// Configure chains & providers
const { chains, publicClient, webSocketPublicClient } = configureChains([abstractTestnet], [publicProvider()])

// Create wagmi config
const config = createConfig({
  autoConnect: true,
  publicClient,
  webSocketPublicClient,
})

// Define the context type
type AGWContextType = {
  isConnected: boolean
  address: string | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  isLoading: boolean
  isAvailable: boolean
  error: string | null
}

// Create the context with default values
const AGWContext = createContext<AGWContextType>({
  isConnected: false,
  address: null,
  connect: async () => {},
  disconnect: async () => {},
  isLoading: false,
  isAvailable: false,
  error: null,
})

// Hook to use the AGW context
export const useAGW = () => useContext(AGWContext)

interface AGWProviderProps {
  children: ReactNode
}

// Provider component
export function AGWProvider({ children }: AGWProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAvailable, setIsAvailable] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check for existing connection on mount
  useEffect(() => {
    const checkAvailability = () => {
      setIsAvailable(typeof window !== "undefined" && window.abstractGlobalWallet !== undefined)
    }

    checkAvailability()

    const checkConnection = async () => {
      if (typeof window !== "undefined" && window.abstractGlobalWallet) {
        try {
          const connected = await window.abstractGlobalWallet.isConnected()
          if (connected) {
            const addr = await window.abstractGlobalWallet.getAddress()
            setIsConnected(true)
            setAddress(addr)
          }
        } catch (err: any) {
          console.error("Error checking AGW connection:", err)
          setError(err.message || "Failed to check AGW connection")
        }
      }
    }

    checkConnection()
  }, [])

  // Connect function
  const connect = async () => {
    setIsLoading(true)
    try {
      if (typeof window !== "undefined" && window.abstractGlobalWallet) {
        await window.abstractGlobalWallet.connect()
        const addr = await window.abstractGlobalWallet.getAddress()
        setIsConnected(true)
        setAddress(addr)
        setError(null)
      } else {
        console.error("Abstract Global Wallet not available")
        setError("Abstract Global Wallet not available")
        throw new Error("Abstract Global Wallet not available")
      }
    } catch (err: any) {
      console.error("Error connecting to AGW:", err)
      setError(err.message || "Failed to connect to AGW")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Disconnect function
  const disconnect = async () => {
    setIsLoading(true)
    try {
      if (typeof window !== "undefined" && window.abstractGlobalWallet) {
        await window.abstractGlobalWallet.disconnect()
        setIsConnected(false)
        setAddress(null)
        setError(null)
      }
    } catch (err: any) {
      console.error("Error disconnecting from AGW:", err)
      setError(err.message || "Failed to disconnect from AGW")
    } finally {
      setIsLoading(false)
    }
  }

  // Context value
  const value = {
    isConnected,
    address,
    connect,
    disconnect,
    isLoading,
    isAvailable,
    error,
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        <AbstractWalletProvider chain={abstractTestnet}>
          <AGWContext.Provider value={value}>{children}</AGWContext.Provider>
        </AbstractWalletProvider>
      </WagmiConfig>
    </QueryClientProvider>
  )
}

// Add TypeScript declaration for the global window object
declare global {
  interface Window {
    abstractGlobalWallet?: {
      connect: () => Promise<void>
      disconnect: () => Promise<void>
      isConnected: () => Promise<boolean>
      getAddress: () => Promise<string>
      // Add other methods as needed
    }
  }
}
