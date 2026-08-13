import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import * as accountingService from '@/services/accounting.service'
import { IncomeStatementCard } from '@/components/accounting/income-statement-card'
import { SimplifiedBalanceCard } from '@/components/accounting/simplified-balance-card'
import { JournalTable } from '@/components/accounting/journal-table'
import { AccountingPeriodSelector } from '@/components/accounting/accounting-period-selector'

export const metadata: Metadata = { title: 'Comptabilité — BizLink AI Africa' }

function defaultMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

export default async function AccountingPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>
}) {
  const { organization } = await requireProfile()
  const supabase = await createClient()
  const { start: startParam, end: endParam } = await searchParams
  const defaults = defaultMonthRange()
  const periodStart = startParam ?? defaults.start
  const periodEnd = endParam ?? defaults.end

  const [incomeStatement, balance, journalEntries] = await Promise.all([
    accountingService.getIncomeStatement(supabase, organization.id, periodStart, periodEnd),
    accountingService.getSimplifiedBalance(supabase, organization.id),
    accountingService.getJournalEntries(supabase, organization.id, periodStart, periodEnd),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Comptabilité</h1>
          <p className="text-sm text-muted-foreground">
            Du {new Date(periodStart).toLocaleDateString('fr-FR')} au {new Date(periodEnd).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <AccountingPeriodSelector periodStart={periodStart} periodEnd={periodEnd} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <IncomeStatementCard statement={incomeStatement} />
        <SimplifiedBalanceCard balance={balance} />
      </div>

      <JournalTable entries={journalEntries} />
    </div>
  )
}
