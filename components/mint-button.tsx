"use client"

import { useState } from "react"
import Image from "next/image"
import { ethers } from "ethers"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { BEEISH_CONTRACT_ABI, BEEISH_CONTRACT_ADDRESS } from "@/lib/contract-abi"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAccount, useChainId, useSendTransaction } from "wagmi"
import { encodeFunctionData } from "viem"

interface MintButtonProps {
  account: string | null
  isAbstractNetwork: boolean
  walletType?: string | null
}

export default function MintButton({ account, isAbstractNetwork, walletType }: MintButtonProps) {
  const [isMinting, setIsMinting] = useState(false)
  const [mintCount, setMintCount] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [imageLoadError, setImageLoadError] = useState(false)
  const { toast } = useToast()

  // Wagmi hooks for additional validation and transactions
  const { address: wagmiAddress } = useAccount()
  const chainId = useChainId()
  const { sendTransaction } = useSendTransaction()

  // Price per NFT is 0.004 ETH
  const PRICE_PER_NFT = 0.004

  const handleMintClick = () => {
    // Use either the passed account or wagmi address
    const effectiveAccount = account || wagmiAddress

    if (!effectiveAccount) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to mint",
        variant: "destructive",
      })
      return
    }

    // For Abstract wallet, skip network check
    if (walletType !== "abstract" && !isAbstractNetwork && chainId !== 2741) {
      toast({
        title: "Wrong network",
        description: "Please switch to the Abstract Chain network",
        variant: "destructive",
      })
      return
    }

    setMintCount(1) // Reset to 1 when opening dialog
    setIsDialogOpen(true)
  }

  const handleMint = async () => {
    setIsMinting(true)
    setIsDialogOpen(false)

    try {
      // Quantity to mint
      const quantity = BigInt(mintCount)

      // Calculate price - hardcoded for simplicity
      // Using a fixed price of 0.004 ETH per NFT
      const totalPrice = ethers.parseEther((PRICE_PER_NFT * mintCount).toString())

      console.log("Mint quantity:", mintCount)
      console.log("Total price (wei):", totalPrice.toString())

      // Create a simplified auth object with zeros for unknown fields
      const auth = {
        key: "0x0000000000000000000000000000000000000000000000000000000000000000",
        proof: [],
      }

      // Use zero address for affiliate
      const affiliate = "0x0000000000000000000000000000000000000000"

      // Empty signature
      const signature = "0x"

      // Check if we're using Abstract wallet
      if (walletType === "abstract") {
        console.log("Using Abstract wallet for transaction")

        // Encode the function data for the mint function
        const data = encodeFunctionData({
          abi: BEEISH_CONTRACT_ABI,
          functionName: "mint",
          args: [auth, quantity, affiliate, signature],
        })

        // Send transaction using wagmi's sendTransaction
        const { hash } = await sendTransaction({
          to: BEEISH_CONTRACT_ADDRESS,
          value: totalPrice,
          data,
          gas: BigInt(500000), // Higher gas limit to ensure it goes through
        })

        console.log("Transaction sent via Abstract wallet:", hash)

        toast({
          title: "Transaction submitted",
          description: "Your mint transaction has been submitted to the blockchain",
        })

        // No need to wait for receipt here as wagmi doesn't provide a direct way to wait
        toast({
          title: "Transaction sent!",
          description: `Your mint transaction for ${mintCount} Bee-ish NFT${mintCount > 1 ? "s" : ""} has been sent!`,
        })
      } else {
        // Use MetaMask or other injected provider
        console.log("Using MetaMask/injected provider for transaction")

        if (!window.ethereum) {
          throw new Error("No wallet found")
        }

        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()

        // For debugging - log the connected account
        const connectedAddress = await signer.getAddress()
        console.log("Connected address:", connectedAddress)

        // Create a contract instance
        const contract = new ethers.Contract(BEEISH_CONTRACT_ADDRESS, BEEISH_CONTRACT_ABI, signer)

        console.log("Sending mint transaction with params:", {
          auth,
          quantity: quantity.toString(),
          affiliate,
          signature,
          value: totalPrice.toString(),
        })

        // Call the mint function directly with the correct parameters
        const tx = await contract.mint(
          auth, // auth object with key and proof
          quantity, // quantity to mint
          affiliate, // affiliate address (zero address)
          signature, // empty signature
          {
            value: totalPrice,
            gasLimit: 500000, // Higher gas limit to ensure it goes through
          },
        )

        console.log("Transaction sent via MetaMask:", tx.hash)

        toast({
          title: "Transaction submitted",
          description: "Your mint transaction has been submitted to the blockchain",
        })

        // Wait for the transaction to be mined
        const receipt = await tx.wait()
        console.log("Transaction confirmed:", receipt)

        toast({
          title: "Mint successful!",
          description: `Successfully minted ${mintCount} Bee-ish NFT${mintCount > 1 ? "s" : ""}!`,
        })
      }
    } catch (error: any) {
      console.error("Minting error:", error)

      // Try to extract a more specific error message
      let errorMessage = "There was an error minting your NFT"

      if (error.message) {
        // Check for common error patterns
        if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds in your wallet"
        } else if (
          error.message.includes("user rejected") ||
          error.message.includes("rejected") ||
          error.message.includes("denied")
        ) {
          errorMessage = "Transaction was rejected"
        } else if (error.message.includes("execution reverted")) {
          // Try to extract the revert reason if available
          const revertReason = error.message.match(/execution reverted: (.*?)(?:,|$)/)
          if (revertReason && revertReason[1]) {
            errorMessage = revertReason[1]
          } else {
            errorMessage = "Contract execution reverted - you may not be eligible to mint"
          }
        } else {
          // Use the error message directly if it's not too technical
          if (error.message.length < 100 && !error.message.includes("0x")) {
            errorMessage = error.message
          }
        }
      }

      toast({
        title: "Minting failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsMinting(false)
    }
  }

  // For Abstract wallet, always enable the mint button if connected
  const isButtonDisabled =
    isMinting || (!account && !wagmiAddress) || (walletType !== "abstract" && !isAbstractNetwork && chainId !== 2741)

  const handleImageError = () => {
    setImageLoadError(true)
    console.error("Failed to load mint button image")
  }

  return (
    <>
      <button
        onClick={handleMintClick}
        disabled={isButtonDisabled}
        className="relative h-16 w-48 group disabled:opacity-70 hover:scale-105 transition-transform duration-200"
      >
        <div className="relative w-full h-full">
          {imageLoadError ? (
            <div className="w-full h-full flex items-center justify-center bg-amber-500 rounded-full">
              <span className="font-bold text-white">Mint</span>
            </div>
          ) : (
            <Image
              src="/mint-button.png"
              alt="Mint"
              width={192}
              height={64}
              className="object-contain"
              onError={handleImageError}
              unoptimized={true}
            />
          )}
          {isMinting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
        </div>
      </button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="border-brown-600 border-4 p-0 overflow-hidden min-w-[280px] w-auto">
          <div className="relative">
            {/* Background color swatch */}
            <div className="absolute inset-0 bg-[#FCB74C]" />

            <div className="relative z-10 p-4">
              <DialogHeader className="mb-3">
                <DialogTitle className="text-center text-2xl text-gray-900 font-bold">Select Quantity</DialogTitle>
                <DialogDescription className="text-center text-gray-800 text-sm">
                  How many NFTs would you like to mint?
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col items-center space-y-6 py-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setMintCount(Math.max(1, mintCount - 1))}
                    className="w-10 h-10 rounded-full bg-gray-900 text-amber-400 font-bold text-xl"
                    disabled={mintCount <= 1}
                  >
                    -
                  </button>

                  <span className="text-2xl font-bold">{mintCount}</span>

                  <button
                    onClick={() => setMintCount(Math.min(100, mintCount + 1))}
                    className="w-10 h-10 rounded-full bg-gray-900 text-amber-400 font-bold text-xl"
                    disabled={mintCount >= 100}
                  >
                    +
                  </button>
                </div>

                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  <button
                    onClick={() => setMintCount(Math.min(10, mintCount))}
                    className="px-2 py-1 rounded bg-gray-800 text-amber-400 text-sm"
                  >
                    10
                  </button>
                  <button
                    onClick={() => setMintCount(Math.min(25, mintCount))}
                    className="px-2 py-1 rounded bg-gray-800 text-amber-400 text-sm"
                  >
                    25
                  </button>
                  <button
                    onClick={() => setMintCount(Math.min(50, mintCount))}
                    className="px-2 py-1 rounded bg-gray-800 text-amber-400 text-sm"
                  >
                    50
                  </button>
                  <button
                    onClick={() => setMintCount(100)}
                    className="px-2 py-1 rounded bg-gray-800 text-amber-400 text-sm"
                  >
                    100
                  </button>
                </div>

                <div className="text-center text-gray-800">
                  <p className="font-bold">Total: {(PRICE_PER_NFT * mintCount).toFixed(3)} ETH</p>
                  <p className="text-sm">Price per NFT: {PRICE_PER_NFT} ETH</p>
                </div>

                <button
                  onClick={handleMint}
                  className="relative h-16 w-48 group hover:scale-105 transition-transform duration-200"
                >
                  <div className="relative w-full h-full">
                    {imageLoadError ? (
                      <div className="w-full h-full flex items-center justify-center bg-amber-500 rounded-full">
                        <span className="font-bold text-white">Confirm Mint</span>
                      </div>
                    ) : (
                      <Image
                        src="/mint-button.png"
                        alt="Confirm Mint"
                        width={192}
                        height={64}
                        className="object-contain"
                        onError={handleImageError}
                        unoptimized={true}
                      />
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
