type ReviewedProofRow = {
  id: string
  reference_number: string | null
  amount: number
  currency: string
  status: string
  review_notes: string | null
  reviewed_at: string | null
  organization: { name: string } | null
}

const STATUS_LABEL: Record<string, string> = {
  paid: 'Validé',
  failed: 'Refusé',
}

const STATUS_CLASS: Record<string, string> = {
  paid: 'bg-success/15 text-success',
  failed: 'bg-destructive/15 text-destructive',
}

export function ReviewedProofsTable({ proofs }: { proofs: ReviewedProofRow[] }) {
  if (proofs.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Aucune preuve traitée pour le moment.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-3">Date</th>
            <th className="p-3">Organisation</th>
            <th className="p-3">Réf.</th>
            <th className="p-3">Statut</th>
            <th className="p-3">Commentaire</th>
            <th className="p-3 text-right">Montant</th>
          </tr>
        </thead>
        <tbody>
          {proofs.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="p-3">{p.reviewed_at ? new Date(p.reviewed_at).toLocaleDateString('fr-FR') : '—'}</td>
              <td className="p-3">{p.organization?.name ?? '—'}</td>
              <td className="p-3 font-mono text-xs">{p.reference_number}</td>
              <td className="p-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${STATUS_CLASS[p.status] ?? ''}`}>
                  {STATUS_LABEL[p.status] ?? p.status}
                </span>
              </td>
              <td className="p-3 text-muted-foreground">{p.review_notes ?? '—'}</td>
              <td className="p-3 text-right font-mono">
                {p.amount.toFixed(2)} {p.currency}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
