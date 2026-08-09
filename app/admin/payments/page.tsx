import type { Metadata } from 'next'
import { requirePlatformAdmin } from '@/lib/platform-admin'
import { createServiceRoleClient } from '@/lib/supabase/server'
import * as paymentProofService from '@/services/payment-proof.service'
import { PendingProofsTable } from '@/components/admin/pending-proofs-table'
import { ReviewedProofsTable } from '@/components/admin/reviewed-proofs-table'

export const metadata: Metadata = { title: 'Vérification des paiements — Admin' }

export default async function AdminPaymentsPage() {
  await requirePlatformAdmin()
  const serviceClient = createServiceRoleClient()

  const [pendingProofs, reviewedProofs] = await Promise.all([
    paymentProofService.listPendingPaymentProofs(serviceClient),
    paymentProofService.listReviewedPaymentProofs(serviceClient),
  ])

  const screenshotUrls: Record<string, string> = {}
  for (const proof of pendingProofs as any[]) {
    if (proof.proof_screenshot_path) {
      try {
        screenshotUrls[proof.id] = await paymentProofService.getProofScreenshotUrl(
          serviceClient,
          proof.proof_screenshot_path
        )
      } catch {
        // capture indisponible : ignoré silencieusement, l'admin verra "Indisponible"
      }
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Vérification des paiements</h1>
        <p className="text-sm text-muted-foreground">
          Preuves de paiement Mobile Money / virement soumises par les commerçants.
        </p>
      </div>

      <div>
        <h2 className="font-medium mb-3">En attente ({pendingProofs.length})</h2>
        <PendingProofsTable proofs={pendingProofs as any} screenshotUrls={screenshotUrls} />
      </div>

      <div>
        <h2 className="font-medium mb-3">Historique</h2>
        <ReviewedProofsTable proofs={reviewedProofs as any} />
      </div>
    </div>
  )
}
