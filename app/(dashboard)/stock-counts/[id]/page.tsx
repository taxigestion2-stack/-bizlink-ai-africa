import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { getStockCount } from '@/services/stock-counts.service'

export const metadata: Metadata = { title: 'Détail du comptage — BizLink AI Africa' }

export default async function StockCountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { organization } = await requireProfile()
  const supabase = await createClient()

  let count: any
  try {
    count = await getStockCount(supabase, organization.id, id)
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Comptage du {new Date(count.completed_at).toLocaleString('fr-FR')}</h1>
        {count.notes && <p className="text-sm text-muted-foreground">{count.notes}</p>}
      </div>

      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Valeur totale des pertes constatées</p>
        <p className="font-mono text-2xl font-semibold text-destructive">
          {Number(count.total_loss_value).toFixed(2)}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Produit</th>
              <th className="p-3 text-right">Stock système</th>
              <th className="p-3 text-right">Compté</th>
              <th className="p-3 text-right">Écart</th>
            </tr>
          </thead>
          <tbody>
            {count.items.map((item: any) => (
              <tr key={item.id} className="border-t">
                <td className="p-3 font-medium">{item.product_name}</td>
                <td className="p-3 text-right text-muted-foreground">{item.system_quantity}</td>
                <td className="p-3 text-right">{item.counted_quantity}</td>
                <td
                  className={`p-3 text-right font-mono ${
                    item.difference < 0
                      ? 'text-destructive'
                      : item.difference > 0
                        ? 'text-success'
                        : 'text-muted-foreground'
                  }`}
                >
                  {item.difference > 0 ? '+' : ''}
                  {item.difference}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
