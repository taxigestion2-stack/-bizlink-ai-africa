import type { ReactNode } from 'react'

const FEATURES = [
  { icon: '📦', text: 'Stock, achats et ventes gérés automatiquement' },
  { icon: '🤖', text: "Assistant IA pour piloter votre commerce au quotidien" },
  { icon: '💳', text: 'Paiements Mobile Money intégrés' },
  { icon: '👥', text: "Toute votre équipe, un seul espace de travail" },
]

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Colonne de marque — masquée sur mobile, visible à partir de md */}
      <div
        className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 md:flex"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, hsl(38 92% 58% / 0.12), transparent 45%), radial-gradient(circle at 80% 80%, hsl(222 47% 22% / 0.8), transparent 55%), hsl(222 47% 5%)',
        }}
      >
        <div>
          <p className="font-display text-2xl font-semibold tracking-tight text-foreground">
            BizLink <span className="text-primary">AI</span> Africa
          </p>
        </div>

        <div className="space-y-8">
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-foreground max-w-md">
            Le logiciel de gestion pensé pour le commerce africain
          </h1>
          <ul className="space-y-4">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-start gap-3 text-foreground/80">
                <span className="text-xl leading-none">{f.icon}</span>
                <span className="text-sm leading-relaxed">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} BizLink AI Africa — Fait pour les commerçants d'Afrique.
        </p>
      </div>

      {/* Colonne formulaire */}
      <div className="flex w-full flex-col items-center justify-center bg-background px-4 py-12 md:w-1/2">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1 text-center md:hidden">
            <p className="font-display text-xl font-semibold tracking-tight">
              BizLink <span className="text-primary">AI</span> Africa
            </p>
            <p className="text-sm text-muted-foreground">Gérez votre commerce, simplement.</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
