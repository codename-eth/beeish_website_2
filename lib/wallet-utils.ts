// Abstract Chain network parameters
export const ABSTRACT_CHAIN = {
  chainId: "0xab5", // 2741 in hexadecimal
  chainName: "Abstract",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://api.mainnet.abs.xyz"],
  blockExplorerUrls: ["https://abscan.org/"],
}

// Connect to MetaMask
export async function connectMetaMask() {
  // Check if ethereum object exists and has the request method
  if (typeof window === "undefined" || !window.ethereum || typeof window.ethereum.request !== "function") {
    console.error("MetaMask is not installed or not accessible")
    throw new Error("MetaMask is not installed or not accessible")
  }

  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
    if (accounts.length === 0) {
      console.error("No accounts found in MetaMask")
      throw new Error("No accounts found")
    }

    // Get current chain ID
    const chainId = await window.ethereum.request({ method: "eth_chainId" })

    return {
      account: accounts[0],
      chainId,
      walletType: "MetaMask",
    }
  } catch (error: any) {
    console.error("MetaMask connection error:", error.message || "Unknown error")
    throw new Error(error.message || "Failed to connect to MetaMask")
  }
}

// Connect to Abstract Wallet
export async function connectAbstractWallet() {
  try {
    console.log("Attempting to connect to Abstract wallet...")

    // First, check if Abstract wallet is available through window.ethereum
    // Many wallets, including Abstract, inject themselves into window.ethereum
    if (typeof window !== "undefined" && window.ethereum && typeof window.ethereum.request === "function") {
      // Check if this is Abstract wallet by looking for specific properties
      // or by checking the provider name/info
      const isAbstract =
        window.ethereum.isAbstract ||
        (window.ethereum.isMetaMask === undefined && window.ethereum.isAbstractWallet) ||
        (window.ethereum.providerInfo && window.ethereum.providerInfo.name === "Abstract")

      console.log("Provider info:", window.ethereum.providerInfo)
      console.log("Is Abstract detected:", isAbstract)

      if (isAbstract) {
        console.log("Abstract wallet detected through window.ethereum")
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
        if (accounts && accounts.length > 0) {
          // Get current chain ID
          const chainId = await window.ethereum.request({ method: "eth_chainId" })

          return {
            account: accounts[0],
            chainId,
            walletType: "Abstract",
          }
        } else {
          console.error("No accounts found in Abstract wallet")
          throw new Error("No accounts found in Abstract wallet")
        }
      }
    }

    // If not found through window.ethereum, check for dedicated window.abstractWallet
    if (typeof window !== "undefined" && window.abstractWallet && typeof window.abstractWallet.request === "function") {
      console.log("Abstract wallet detected through window.abstractWallet")
      const accounts = await window.abstractWallet.request({ method: "eth_requestAccounts" })
      if (accounts && accounts.length > 0) {
        return {
          account: accounts[0],
          chainId: ABSTRACT_CHAIN.chainId, // Assume Abstract Chain
          walletType: "Abstract",
        }
      } else {
        console.error("No accounts found in Abstract wallet")
        throw new Error("No accounts found in Abstract wallet")
      }
    }

    // If we reach here, Abstract wallet is not available
    console.error("Abstract wallet is not installed or not detected")
    throw new Error("Abstract wallet is not installed or not detected")
  } catch (error: any) {
    console.error("Abstract wallet connection error:", error.message || "Unknown error")
    throw new Error(error.message || "Failed to connect to Abstract wallet")
  }
}

// Switch to Abstract Network
export async function switchToAbstractNetwork() {
  if (typeof window === "undefined" || !window.ethereum || typeof window.ethereum.request !== "function") {
    console.error("MetaMask is not installed or not accessible")
    throw new Error("MetaMask is not installed or not accessible")
  }

  try {
    console.log("Attempting to switch to Abstract Chain...")
    console.log("Target chainId:", ABSTRACT_CHAIN.chainId)

    // First try to switch to the network if it's already added
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ABSTRACT_CHAIN.chainId }],
    })

    console.log("Successfully switched to Abstract Chain")
    return true
  } catch (switchError: any) {
    console.error("Error switching network:", switchError.message || "Unknown error")

    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        console.log("Chain not found, attempting to add Abstract Chain...")
        console.log("Chain parameters:", ABSTRACT_CHAIN)

        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [ABSTRACT_CHAIN],
        })

        console.log("Successfully added Abstract Chain")
        return true
      } catch (addError: any) {
        console.error("Error adding network:", addError.message || "Unknown error")
        throw new Error(addError.message || "Failed to add Abstract Chain to your wallet")
      }
    } else {
      throw new Error(switchError.message || "Failed to switch to Abstract Chain")
    }
  }
}

// Format address for display
export function formatAddress(address: string) {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}

// Check if connected to Abstract Network
export function isAbstractNetwork(chainId: string) {
  // Convert both chainIds to lowercase strings for comparison
  const normalizedChainId = chainId.toLowerCase()
  const abstractChainIdHex = ABSTRACT_CHAIN.chainId.toLowerCase()
  const abstractChainIdDec = "2741" // Decimal representation of 0xAB5

  // Check if chainId matches either the hex or decimal representation
  const result =
    normalizedChainId === abstractChainIdHex ||
    normalizedChainId === "0x" + abstractChainIdDec ||
    normalizedChainId === abstractChainIdDec

  console.log(
    `Checking if chainId ${chainId} is Abstract Network (${ABSTRACT_CHAIN.chainId} or ${abstractChainIdDec}): ${result}`,
  )
  return result
}

// Add type declaration for window.abstractWallet
declare global {
  interface Window {
    ethereum?: any
    abstractWallet?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
    }
  }
}
