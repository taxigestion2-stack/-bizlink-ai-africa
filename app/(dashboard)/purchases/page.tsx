import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { listPurchases } from '@/services/purchases.service'
import { PurchaseTable } from '@/components/purchases/purchase-table'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Achats — BizLink AI Africa' }

export default async function PurchasesPage() {
  const { organization } = await requireProfile()
  const supabase = await createClient()
  const purchases = await listPurchases(supabase, organization.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Achats</h1>
          <p className="text-sm text-muted-foreground">Historique de vos achats fournisseurs</p>
        </div>
        <Button asChild>
          <Link href="/purchases/new">Nouvel achat</Link>
        </Button>
      </div>

      <PurchaseTable purchases={purchases as any} />
    </div>
  )
}
