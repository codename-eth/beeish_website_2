"use client"

import { useState, useEffect } from "react"
import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useSwitchChain } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, XCircle, AlertCircle, ExternalLink, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { abstractTestnet, metaMaskConnector } from "@/lib/wagmi-config"
import Image from "next/image"
import { useLoginWithAbstract } from "@abstract-foundation/agw-react"

export function WalletTest() {
  const { address, isConnected, connector: activeConnector } = useAccount()
  const { connect, isPending: isConnectPending, error: connectError } = useConnect()
  const { disconnect, isPending: isDisconnectPending } = useDisconnect()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitchPending } = useSwitchChain()
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance({
    address,
    enabled: !!address,
  })
  const { toast } = useToast()
  const { login } = useLoginWithAbstract()

  const [copied, setCopied] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle")
  const [connectionDetails, setConnectionDetails] = useState<string>("")
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [abstractAddress, setAbstractAddress] = useState<string | null>(null)
  const [isAbstractBalanceLoading, setIsAbstractBalanceLoading] = useState(false)
  const [abstractBalance, setAbstractBalance] = useState<{ balance: string; symbol: string } | null>(null)

  // Update connection status based on account state
  useEffect(() => {
    if (connectError) {
      setConnectionStatus("error")
      setConnectionDetails(connectError.message)
    } else if (isConnected || abstractAddress) {
      setConnectionStatus("connected")
      setConnectionDetails(
        `Connected to ${abstractAddress ? "Abstract Global Wallet" : activeConnector?.name || "wallet"}`,
      )
    } else if (isConnectPending) {
      setConnectionStatus("connecting")
      setConnectionDetails("Connecting to wallet...")
    } else {
      setConnectionStatus("idle")
      setConnectionDetails("Not connected")
    }
  }, [isConnected, isConnectPending, connectError, activeConnector, abstractAddress])

  // Handle MetaMask connection
  const handleMetaMaskConnect = async () => {
    try {
      console.log("Connecting with MetaMask connector")
      await connect({ connector: metaMaskConnector })

      toast({
        title: "Connected",
        description: "Successfully connected to MetaMask",
      })
    } catch (error: any) {
      console.error("Connection error:", error)
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      })
    }
  }

  // Handle Abstract connection
  const handleAbstractConnect = async () => {
    try {
      console.log("Connecting with Abstract wallet")
      await login()

      if (address) {
        setAbstractAddress(address)
        toast({
          title: "Connected",
          description: "Successfully connected to Abstract Global Wallet",
        })
      }
    } catch (error: any) {
      console.error("Abstract connection error:", error)
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Abstract Global Wallet",
        variant: "destructive",
      })
    }
  }

  // Handle wallet disconnection
  const handleDisconnect = async () => {
    try {
      await disconnect()
      setAbstractAddress(null)
      toast({
        title: "Disconnected",
        description: "Your wallet has been disconnected",
      })
    } catch (error: any) {
      console.error("Disconnect error:", error)
      toast({
        title: "Disconnect Failed",
        description: error.message || "Failed to disconnect wallet",
        variant: "destructive",
      })
    }
  }

  // Handle chain switching
  const handleSwitchChain = async (targetChainId: number) => {
    try {
      await switchChain({ chainId: targetChainId })
      toast({
        title: "Chain Switched",
        description: `Successfully switched to ${targetChainId === abstractTestnet.id ? "Abstract" : "Mainnet"}`,
      })
    } catch (error: any) {
      console.error("Chain switch error:", error)
      toast({
        title: "Chain Switch Failed",
        description: error.message || "Failed to switch chain",
        variant: "destructive",
      })
    }
  }

  // Copy address to clipboard
  const copyAddress = () => {
    const addrToCopy = address || abstractAddress
    if (addrToCopy) {
      navigator.clipboard.writeText(addrToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
  }

  // Get wallet icon based on connector
  const getWalletIcon = () => {
    if (abstractAddress) return "/abstract-wallet-logo.png"
    if (!activeConnector) return "/placeholder.svg"

    if (activeConnector.name === "MetaMask") {
      return "/metamask-fox-logo.png"
    }

    return "/wallet-icon.png"
  }

  // Get chain name based on chain ID
  const getChainName = (id: number) => {
    if (id === abstractTestnet.id) return "Abstract Chain"
    if (id === 1) return "Ethereum Mainnet"
    return `Chain ID: ${id}`
  }

  // Get explorer URL based on chain ID and address
  const getExplorerUrl = () => {
    const addr = address || abstractAddress
    if (!addr) return "#"

    if (chainId === abstractTestnet.id || abstractAddress) {
      return `https://abscan.org/address/${addr}`
    }
    return `https://etherscan.io/address/${addr}`
  }

  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== "undefined" && window.ethereum && (window.ethereum.isMetaMask || false)

  return (
    <div className="space-y-6 w-full max-w-md mx-auto">
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Wallet Connection Test</span>
            {connectionStatus === "connected" && (
              <span className="text-sm font-normal flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                Connected
              </span>
            )}
          </CardTitle>
          <CardDescription>Test connecting to MetaMask and Abstract wallets</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Connection Status */}
          <div className="mb-4 p-3 rounded-md bg-slate-100 flex items-center">
            {connectionStatus === "idle" && <AlertCircle className="h-5 w-5 text-slate-500 mr-2" />}
            {connectionStatus === "connecting" && <Loader2 className="h-5 w-5 text-amber-500 animate-spin mr-2" />}
            {connectionStatus === "connected" && <CheckCircle className="h-5 w-5 text-green-600 mr-2" />}
            {connectionStatus === "error" && <XCircle className="h-5 w-5 text-red-600 mr-2" />}
            <span className={`text-sm ${connectionStatus === "error" ? "text-red-600" : "text-slate-700"}`}>
              {connectionDetails}
            </span>
          </div>

          {/* Connection Buttons */}
          {!isConnected && !abstractAddress ? (
            <div className="space-y-3">
              <Button
                onClick={handleMetaMaskConnect}
                disabled={isConnectPending || !isMetaMaskInstalled}
                className="w-full flex items-center justify-center gap-2"
              >
                {isConnectPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <div className="relative h-5 w-5 mr-1">
                  <Image src="/metamask-fox-logo.png" alt="MetaMask" fill className="object-contain" />
                </div>
                Connect MetaMask
                {!isMetaMaskInstalled && <span className="text-xs ml-2">(Not installed)</span>}
              </Button>

              <Button
                onClick={handleAbstractConnect}
                disabled={isConnectPending}
                className="w-full flex items-center justify-center gap-2"
              >
                {isConnectPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <div className="relative h-5 w-5 mr-1">
                  <Image src="/abstract-wallet-logo.png" alt="Abstract" fill className="object-contain" />
                </div>
                Connect Abstract
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Connected Wallet Info */}
              <div className="flex items-center space-x-2">
                <div className="relative h-8 w-8">
                  <Image src={getWalletIcon() || "/placeholder.svg"} alt="Wallet" fill className="object-contain" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {abstractAddress ? "Abstract Global Wallet" : activeConnector?.name || "Wallet"}
                  </p>
                  <div className="flex items-center">
                    <p className="text-xs text-slate-500">
                      {address || abstractAddress ? formatAddress(address || abstractAddress) : "Unknown address"}
                    </p>
                    <button onClick={copyAddress} className="ml-1 text-slate-400 hover:text-slate-600">
                      {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Chain Info */}
              <div className="p-3 rounded-md bg-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Network</span>
                  <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full">
                    {abstractAddress ? "Abstract Chain" : getChainName(chainId)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Balance</span>
                  {isBalanceLoading || isAbstractBalanceLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <span className="text-xs font-mono">
                      {balanceData
                        ? `${Number.parseFloat(balanceData.formatted).toFixed(4)} ${balanceData.symbol}`
                        : abstractBalance
                          ? `${Number.parseFloat(abstractBalance.balance).toFixed(4)} ${abstractBalance.symbol}`
                          : abstractAddress
                            ? "Balance unavailable"
                            : "0.0000 ETH"}
                    </span>
                  )}
                </div>
              </div>

              {/* Chain Switching (only for wagmi connections) */}
              {isConnected && !abstractAddress && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Switch Network:</p>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant={chainId === 1 ? "default" : "outline"}
                      onClick={() => handleSwitchChain(1)}
                      disabled={isSwitchPending || chainId === 1}
                      className="flex-1"
                    >
                      {isSwitchPending && chainId !== 1 && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                      Ethereum
                    </Button>
                    <Button
                      size="sm"
                      variant={chainId === abstractTestnet.id ? "default" : "outline"}
                      onClick={() => handleSwitchChain(abstractTestnet.id)}
                      disabled={isSwitchPending || chainId === abstractTestnet.id}
                      className="flex-1"
                    >
                      {isSwitchPending && chainId !== abstractTestnet.id && (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      )}
                      Abstract
                    </Button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 flex items-center justify-center"
                  onClick={() => window.open(getExplorerUrl(), "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Explorer
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDisconnect}
                  disabled={isDisconnectPending}
                >
                  {isDisconnectPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                  Disconnect
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start">
          <p className="text-xs text-slate-500">
            This is a test page for wallet connections. It supports both MetaMask and Abstract wallets.
          </p>
        </CardFooter>
      </Card>

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs font-mono bg-slate-100 p-3 rounded-md overflow-auto max-h-40">
            <p>Connected via wagmi: {isConnected ? "Yes" : "No"}</p>
            <p>Connected via Abstract direct: {abstractAddress ? "Yes" : "No"}</p>
            <p>Wagmi Address: {address || "None"}</p>
            <p>Abstract Address: {abstractAddress || "None"}</p>
            <p>Chain ID: {chainId || "None"}</p>
            <p>Connector: {activeConnector?.name || "None"}</p>
            <p>Balance: {balanceData ? `${balanceData.formatted} ${balanceData.symbol}` : "Unknown"}</p>
            <p>
              Abstract Balance: {abstractBalance ? `${abstractBalance.balance} ${abstractBalance.symbol}` : "Unknown"}
            </p>
            <p>MetaMask Installed: {isMetaMaskInstalled ? "Yes" : "No"}</p>
            <p>Debug Info: {debugInfo}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
