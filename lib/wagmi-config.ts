import { http, createConfig } from "wagmi"
import { mainnet, sepolia } from "viem/chains"
import { injected } from "wagmi/connectors"

// Abstract Chain network parameters
export const ABSTRACT_CHAIN_ID = 2741

export const abstractTestnet = {
  id: ABSTRACT_CHAIN_ID,
  name: "Abstract",
  network: "abstract",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://api.mainnet.abs.xyz"],
    },
    public: {
      http: ["https://api.mainnet.abs.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "ABScan",
      url: "https://abscan.org",
    },
  },
}

// Create MetaMask connector using the injected connector
export const metaMaskConnector = injected({
  target: "metaMask",
})

// Create wagmi config
export const config = createConfig({
  chains: [mainnet, sepolia, abstractTestnet],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [abstractTestnet.id]: http(),
  },
  connectors: [metaMaskConnector],
  autoConnect: true, // Explicitly set autoConnect to true
})
