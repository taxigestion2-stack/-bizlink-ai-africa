import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import * as affiliateService from '@/services/affiliate.service'
import { ApplyAffiliateCard } from '@/components/affiliate/apply-affiliate-card'
import { AffiliateLinkCard } from '@/components/affiliate/affiliate-link-card'
import { WithdrawalForm } from '@/components/affiliate/withdrawal-form'
import { CommissionsTable, WithdrawalsTable } from '@/components/affiliate/affiliate-tables'
import { StatsCards } from '@/components/dashboard/stats-cards'

export const metadata: Metadata = { title: 'Affiliation — BizLink AI Africa' }

export default async function AffiliatePage() {
  const { profile } = await requireProfile()
  const supabase = await createClient()

  const account = await affiliateService.getAffiliateAccount(supabase, profile.id)

  if (!account) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Programme d'affiliation</h1>
        <ApplyAffiliateCard />
      </div>
    )
  }

  const [commissions, withdrawals] = await Promise.all([
    affiliateService.listCommissions(supabase, account.id),
    affiliateService.listWithdrawals(supabase, account.id),
  ])

  const pendingOrPaidWithdrawals = withdrawals
    .filter((w: any) => w.status !== 'rejected')
    .reduce((sum: number, w: any) => sum + Number(w.amount), 0)
  const available = Number(account.total_earnings) - pendingOrPaidWithdrawals

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Programme d'affiliation</h1>
        <p className="text-sm text-muted-foreground">Suivez vos clics, conversions et commissions.</p>
      </div>

      <StatsCards
        stats={[
          { label: 'Clics', value: `${account.total_clicks}` },
          { label: 'Conversions', value: `${account.total_conversions}` },
          { label: 'Gains totaux', value: Number(account.total_earnings).toFixed(2) },
          { label: 'Disponible', value: available.toFixed(2) },
        ]}
      />

      <AffiliateLinkCard code={account.affiliate_code} status={account.status} />

      {account.status === 'approved' && (
        <WithdrawalForm affiliateAccountId={account.id} available={Math.max(available, 0)} />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="font-medium mb-3">Commissions</h2>
          <CommissionsTable commissions={commissions as any} />
        </div>
        <div>
          <h2 className="font-medium mb-3">Retraits</h2>
          <WithdrawalsTable withdrawals={withdrawals as any} />
        </div>
      </div>
    </div>
  )
}
