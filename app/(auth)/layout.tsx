import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-background p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-xl font-semibold">BizLink AI Africa</h1>
          <p className="text-sm text-muted-foreground">Gérez votre commerce, simplement.</p>
        </div>
        {children}
      </div>
    </div>
  )
}
