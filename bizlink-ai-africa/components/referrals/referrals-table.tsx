type ReferralRow = {
  id: string
  status: 'pending' | 'converted' | 'rewarded'
  reward_granted: boolean
  created_at: string
  referred_organization: { name: string } | null
}

const STATUS_LABEL: Record<ReferralRow['status'], string> = {
  pending: 'Inscrit (en attente)',
  converted: 'Converti',
  rewarded: 'Récompensé',
}

export function ReferralsTable({ referrals }: { referrals: ReferralRow[] }) {
  if (referrals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Aucun filleul pour le moment. Partagez votre lien pour commencer.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-3">Filleul</th>
            <th className="p-3">Date d'inscription</th>
            <th className="p-3">Statut</th>
            <th className="p-3">Récompense</th>
          </tr>
        </thead>
        <tbody>
          {referrals.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-3">{r.referred_organization?.name ?? '—'}</td>
              <td className="p-3">{new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
              <td className="p-3">{STATUS_LABEL[r.status]}</td>
              <td className="p-3">{r.reward_granted ? '✅ Débloquée' : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
