type Stat = { label: string; value: string; hint?: string }

export function StatsCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">{stat.label}</p>
          <p className="font-mono text-2xl font-medium tracking-tight mt-1">{stat.value}</p>
          {stat.hint && <p className="text-xs text-muted-foreground mt-1">{stat.hint}</p>}
        </div>
      ))}
    </div>
  )
}
