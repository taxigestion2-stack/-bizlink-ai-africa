import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { listStockCounts } from '@/services/stock-counts.service'
import { StockCountHistoryTable } from '@/components/stock-counts/stock-count-history-table'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Comptage physique — BizLink AI Africa' }

export default async function StockCountsPage() {
  const { organization } = await requireProfile()
  const supabase = await createClient()
  const counts = await listStockCounts(supabase, organization.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Comptage physique</h1>
          <p className="text-sm text-muted-foreground">
            Comparez le stock réel de votre boutique à celui enregistré dans l'application.
          </p>
        </div>
        <Button asChild>
          <Link href="/stock-counts/new">Nouveau comptage</Link>
        </Button>
      </div>

      <StockCountHistoryTable counts={counts as any} />
    </div>
  )
}
