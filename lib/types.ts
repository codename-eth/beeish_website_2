// lib/types.ts
export interface AGWAccount {
  address: string
  chainId: string
  walletType: string
}

export interface TransactionParams {
  to: string
  value: string
  data: string
  gasLimit: string
}
