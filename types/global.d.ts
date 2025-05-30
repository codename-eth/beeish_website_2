// Global type declarations for Abstract Global Wallet
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

export {}
