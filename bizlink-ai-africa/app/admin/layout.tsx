import type { ReactNode } from 'react'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-semibold">
            BizLink <span className="text-primary">AI</span> Africa <span className="text-muted-foreground font-normal text-sm">— Admin plateforme</span>
          </p>
          <Link href="/dashboard" className="text-sm text-muted-foreground underline">
            Retour à mon espace
          </Link>
        </div>
      </header>
      <main className="p-6 md:p-8">{children}</main>
    </div>
  )
}
