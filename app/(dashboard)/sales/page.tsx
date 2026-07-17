import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { listSales } from '@/services/sales.service'
import { SaleTable } from '@/components/sales/sale-table'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Ventes — BizLink AI Africa' }

export default async function SalesPage() {
  const { organization } = await requireProfile()
  const supabase = await createClient()
  const sales = await listSales(supabase, organization.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Ventes</h1>
          <p className="text-sm text-muted-foreground">Historique de vos ventes</p>
        </div>
        <Button asChild>
          <Link href="/sales/new">Nouvelle vente</Link>
        </Button>
      </div>

      <SaleTable sales={sales as any} />
    </div>
  )
}
