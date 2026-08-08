'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/actions/auth'
import { Button } from '@/components/ui/button'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Tableau de bord' },
  { href: '/products', label: 'Produits' },
  { href: '/stock-counts', label: 'Comptage physique' },
  { href: '/purchases', label: 'Achats' },
  { href: '/sales', label: 'Ventes' },
  { href: '/expenses', label: 'Dépenses' },
  { href: '/debts', label: 'Dettes clients' },
  { href: '/reports', label: 'Rapports' },
  { href: '/savings', label: 'Épargne' },
  { href: '/team', label: 'Équipe' },        
  { href: '/ai', label: 'Assistant IA' },
  { href: '/subscriptions', label: 'Abonnement' },
  { href: '/referrals', label: 'Parrainage' },
  { href: '/affiliate', label: 'Affiliation' },
]

export function Sidebar({ organizationName }: { organizationName: string }) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-card">
      <div className="p-5 border-b border-border">
        <p className="font-display text-lg font-semibold tracking-tight">
          BizLink <span className="text-primary">AI</span> Africa
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{organizationName}</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-foreground/80 hover:bg-accent hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-border">
        <form action={signOut}>
          <Button type="submit" variant="ghost" className="w-full justify-start">
            Se déconnecter
          </Button>
        </form>
      </div>
    </aside>
  )
}