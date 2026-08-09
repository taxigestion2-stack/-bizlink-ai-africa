'use client'

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

type Point = { date: string; revenue: number; profit: number }

export function RevenueChart({ data }: { data: Point[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
  }))

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm font-medium mb-4">Revenus des 7 derniers jours</p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
          <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip />
          <Line type="monotone" dataKey="revenue" name="Chiffre d'affaires" stroke="#2563eb" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="profit" name="Bénéfice" stroke="#16a34a" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
