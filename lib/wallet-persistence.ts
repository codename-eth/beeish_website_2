// Wallet persistence utility functions

// Types for stored wallet data
export interface StoredWalletData {
  walletType: string | null
  isAbstractNetwork: boolean
  timestamp: number
}

// Key for localStorage
const WALLET_STORAGE_KEY = "beeish-wallet-connection"

// Store wallet connection data
export function storeWalletConnection(walletType: string | null, isAbstractNetwork: boolean): void {
  if (typeof window === "undefined") return

  try {
    const data: StoredWalletData = {
      walletType,
      isAbstractNetwork,
      timestamp: Date.now(),
    }

    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(data))
    console.log("Wallet connection stored:", data)
  } catch (error) {
    console.error("Error storing wallet connection:", error)
  }
}

// Get stored wallet connection data
export function getStoredWalletConnection(): StoredWalletData | null {
  if (typeof window === "undefined") return null

  try {
    const storedData = localStorage.getItem(WALLET_STORAGE_KEY)
    if (!storedData) return null

    const data: StoredWalletData = JSON.parse(storedData)

    // Check if data is expired (24 hours)
    const isExpired = Date.now() - data.timestamp > 24 * 60 * 60 * 1000
    if (isExpired) {
      clearStoredWalletConnection()
      return null
    }

    return data
  } catch (error) {
    console.error("Error retrieving wallet connection:", error)
    return null
  }
}

// Clear stored wallet connection data
export function clearStoredWalletConnection(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(WALLET_STORAGE_KEY)
    console.log("Wallet connection cleared from storage")
  } catch (error) {
    console.error("Error clearing wallet connection:", error)
  }
}
