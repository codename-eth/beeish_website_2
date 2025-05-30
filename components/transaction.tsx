"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { TransactionParams } from "@/lib/types"

export function TransactionComponent() {
  const [transactionParams, setTransactionParams] = useState<TransactionParams>({
    to: "",
    value: "",
    data: "",
    gasLimit: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setTransactionParams((prevParams) => ({
      ...prevParams,
      [name]: value,
    }))
  }

  const handleSubmit = async () => {
    // Implement transaction signing and sending logic here
    console.log("Transaction parameters:", transactionParams)
  }

  return (
    <div className="w-full space-y-4">
      <h2 className="text-lg font-semibold">Send Transaction</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700">To Address</label>
        <Input
          type="text"
          name="to"
          value={transactionParams.to}
          onChange={handleInputChange}
          className="mt-1 block w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Value (ETH)</label>
        <Input
          type="text"
          name="value"
          value={transactionParams.value}
          onChange={handleInputChange}
          className="mt-1 block w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Data</label>
        <Input
          type="text"
          name="data"
          value={transactionParams.data}
          onChange={handleInputChange}
          className="mt-1 block w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Gas Limit</label>
        <Input
          type="text"
          name="gasLimit"
          value={transactionParams.gasLimit}
          onChange={handleInputChange}
          className="mt-1 block w-full"
        />
      </div>
      <Button onClick={handleSubmit} className="w-full">
        Send Transaction
      </Button>
    </div>
  )
}
