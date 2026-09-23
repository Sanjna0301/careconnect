import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CAMPAIGNS, type Campaign } from '@/data/campaigns'
import { draftToCampaign, type CampaignDraft } from '@/lib/campaignDraft'
import { readJSON, writeJSON } from '@/lib/storage'

/**
 * Campaigns = the seeded set plus anything the user has created here.
 *
 * User campaigns persist in localStorage so a created campaign survives a
 * reload, which is what makes the flow testable end to end. In production
 * this is a server collection; the shape is identical so the swap is local
 * to this file.
 */

const STORAGE_KEY = 'careconnect.campaigns.v1'

type CampaignsValue = {
  campaigns: Campaign[]
  /** Only the ones created in this browser. */
  mine: Campaign[]
  byId: (id: string) => Campaign | undefined
  create: (draft: CampaignDraft) => Campaign
  /** Stands in for the hospital verification desk. */
  markVerified: (id: string) => void
  remove: (id: string) => void
  isMine: (id: string) => boolean
}

const CampaignsContext = createContext<CampaignsValue | null>(null)

export function useCampaigns(): CampaignsValue {
  const ctx = useContext(CampaignsContext)
  if (!ctx) throw new Error('useCampaigns must be used inside <CampaignsProvider>')
  return ctx
}

const newId = () => `c-user-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`

export function CampaignsProvider({ children }: { children: ReactNode }) {
  const [mine, setMine] = useState<Campaign[]>(() => readJSON<Campaign[]>(STORAGE_KEY, []))

  useEffect(() => {
    writeJSON(STORAGE_KEY, mine)
  }, [mine])

  // Newest first, so a campaign someone just created is at the top.
  const campaigns = useMemo(() => [...mine, ...CAMPAIGNS], [mine])

  const byId = useCallback(
    (id: string) => campaigns.find((c) => c.id === id),
    [campaigns],
  )

  const create = useCallback((draft: CampaignDraft) => {
    const campaign = draftToCampaign(draft, newId())
    setMine((list) => [campaign, ...list])
    return campaign
  }, [])

  const markVerified = useCallback((id: string) => {
    const verifiedOn = new Date().toISOString()
    setMine((list) =>
      list.map((c) =>
        c.id === id && c.status !== 'verified'
          ? {
              ...c,
              status: 'verified' as const,
              verifiedBy: 'Hospital billing office — estimate confirmed',
              documents: c.documents.map((d) => ({
                ...d,
                verifiedOn,
                verifiedBy: 'Hospital billing office',
              })),
            }
          : c,
      ),
    )
  }, [])

  const remove = useCallback((id: string) => {
    setMine((list) => list.filter((c) => c.id !== id))
  }, [])

  const isMine = useCallback((id: string) => mine.some((c) => c.id === id), [mine])

  const value = useMemo(
    () => ({ campaigns, mine, byId, create, markVerified, remove, isMine }),
    [campaigns, mine, byId, create, markVerified, remove, isMine],
  )

  return <CampaignsContext.Provider value={value}>{children}</CampaignsContext.Provider>
}
