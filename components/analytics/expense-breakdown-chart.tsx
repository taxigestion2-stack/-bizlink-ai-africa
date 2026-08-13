'use client'

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

type Category = { category: string; amount: number }

const COLORS = ['#f0b429', '#2563eb', '#16a34a', '#dc2626', '#9333ea', '#0891b2', '#ea580c']

export function ExpenseBreakdownChart({ categories }: { categories: Category[] }) {
  if (categories.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm font-medium mb-2">Répartition des dépenses</p>
        <p className="text-sm text-muted-foreground py-8 text-center">Aucune dépense sur cette période.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm font-medium mb-4">Répartition des dépenses</p>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={categories}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={(entry) => entry.category}
          >
            {categories.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
