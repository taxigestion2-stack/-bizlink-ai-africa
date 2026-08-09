import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { getReferralCode, listReferrals, getReferralStats } from '@/services/referrals.service'
import { ReferralLinkCard } from '@/components/referrals/referral-link-card'
import { ReferralsTable } from '@/components/referrals/referrals-table'
import { StatsCards } from '@/components/dashboard/stats-cards'

export const metadata: Metadata = { title: 'Parrainage — BizLink AI Africa' }

export default async function ReferralsPage() {
  const { organization } = await requireProfile()
  const supabase = await createClient()

  const [referralCode, referrals, stats] = await Promise.all([
    getReferralCode(supabase, organization.id),
    listReferrals(supabase, organization.id),
    getReferralStats(supabase, organization.id),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Parrainage</h1>
        <p className="text-sm text-muted-foreground">
          Invitez d'autres commerçants et gagnez des récompenses.
        </p>
      </div>

      <StatsCards
        stats={[
          { label: 'Filleuls inscrits', value: `${stats.totalReferrals}` },
          { label: 'Convertis (payants)', value: `${stats.converted}` },
          { label: 'Récompenses débloquées', value: `${stats.rewarded}` },
        ]}
      />

      <ReferralLinkCard code={referralCode.code} />

      <div>
        <h2 className="font-medium mb-3">Vos filleuls</h2>
        <ReferralsTable referrals={referrals as any} />
      </div>
    </div>
  )
}
