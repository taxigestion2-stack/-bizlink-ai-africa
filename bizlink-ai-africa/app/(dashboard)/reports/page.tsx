import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth/require-profile'
import { listInventoryReports } from '@/services/inventory.service'
import { InventoryReportTable } from '@/components/reports/inventory-report-table'
import { GenerateReportForm } from '@/components/reports/generate-report-form'
import { ExportPdfButton } from '@/components/reports/export-pdf-button'

export const metadata: Metadata = { title: 'Rapports — BizLink AI Africa' }

export default async function ReportsPage() {
  const { organization } = await requireProfile()
  const supabase = await createClient()
  const reports = await listInventoryReports(supabase, organization.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Rapports d'inventaire</h1>
          <p className="text-sm text-muted-foreground">
            Comparaison mensuelle du stock, des achats et des ventes.
          </p>
        </div>
        <ExportPdfButton
          reports={reports as any}
          organizationName={organization.name}
          plan={organization.plan as 'free' | 'starter' | 'pro'}
        />
      </div>

      <GenerateReportForm />
      <InventoryReportTable reports={reports as any} />
    </div>
  )
}
