type CommissionRow = { id: string; amount: number; status: string; created_at: string }
type WithdrawalRow = { id: string; amount: number; status: string; requested_at: string }

export function CommissionsTable({ commissions }: { commissions: CommissionRow[] }) {
  if (commissions.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">Aucune commission pour le moment.</p>
  }
  return (
    <table className="w-full text-sm rounded-lg border overflow-hidden">
      <thead className="bg-muted/50 text-left">
        <tr>
          <th className="p-3">Date</th>
          <th className="p-3">Statut</th>
          <th className="p-3 text-right">Montant</th>
        </tr>
      </thead>
      <tbody>
        {commissions.map((c) => (
          <tr key={c.id} className="border-t">
            <td className="p-3">{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
            <td className="p-3 capitalize">{c.status}</td>
            <td className="p-3 text-right">{c.amount.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function WithdrawalsTable({ withdrawals }: { withdrawals: WithdrawalRow[] }) {
  if (withdrawals.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">Aucune demande de retrait.</p>
  }
  return (
    <table className="w-full text-sm rounded-lg border overflow-hidden">
      <thead className="bg-muted/50 text-left">
        <tr>
          <th className="p-3">Date</th>
          <th className="p-3">Statut</th>
          <th className="p-3 text-right">Montant</th>
        </tr>
      </thead>
      <tbody>
        {withdrawals.map((w) => (
          <tr key={w.id} className="border-t">
            <td className="p-3">{new Date(w.requested_at).toLocaleDateString('fr-FR')}</td>
            <td className="p-3 capitalize">{w.status}</td>
            <td className="p-3 text-right">{w.amount.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
