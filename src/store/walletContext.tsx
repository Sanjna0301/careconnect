import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  addClaim, loadWallet, redeem, resetWallet, saveWallet, verifyClaim,
  type RescueClaim, type WalletState,
} from '@/store/wallet'

type WalletValue = {
  wallet: WalletState
  submitClaim: (input: Parameters<typeof addClaim>[1]) => void
  markVerified: (claimId: string) => void
  spend: (coins: number, billRef: string, note: string) => void
  reset: () => void
}

const WalletContext = createContext<WalletValue | null>(null)

export function useWallet(): WalletValue {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside <WalletProvider>')
  return ctx
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>(() => loadWallet())

  useEffect(() => {
    saveWallet(wallet)
  }, [wallet])

  const submitClaim = useCallback((input: Omit<RescueClaim, 'id' | 'status' | 'submittedAt' | 'reviewedAt' | 'reviewerNote' | 'coinsAwarded'>) => {
    setWallet((s) => addClaim(s, input))
  }, [])

  const markVerified = useCallback((claimId: string) => {
    setWallet((s) => verifyClaim(s, claimId))
  }, [])

  const spend = useCallback((coins: number, billRef: string, note: string) => {
    setWallet((s) => redeem(s, coins, billRef, note))
  }, [])

  const reset = useCallback(() => setWallet(resetWallet()), [])

  const value = useMemo(
    () => ({ wallet, submitClaim, markVerified, spend, reset }),
    [wallet, submitClaim, markVerified, spend, reset],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}
