'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

type Product = { name: string; quantity: number; revenue: number }

export function TopProductsChart({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm font-medium mb-2">Meilleurs produits</p>
        <p className="text-sm text-muted-foreground py-8 text-center">Aucune vente sur cette période.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm font-medium mb-4">Meilleurs produits (par chiffre d'affaires)</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={products} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
          <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" fontSize={12} tickLine={false} axisLine={false} width={100} />
          <Tooltip />
          <Bar dataKey="revenue" name="Chiffre d'affaires" fill="hsl(38 92% 58%)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
