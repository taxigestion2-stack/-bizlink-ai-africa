# BizLink AI Africa — Architecture (Fondations)

## 1. Structure des dossiers (Next.js 15 App Router)

```
bizlink-ai-africa/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                 # layout protégé (vérifie la session)
│   │   ├── dashboard/page.tsx
│   │   ├── products/
│   │   ├── inventory/
│   │   ├── purchases/
│   │   ├── sales/
│   │   ├── expenses/
│   │   ├── debts/
│   │   ├── reports/
│   │   ├── subscriptions/
│   │   ├── payments/
│   │   ├── referrals/
│   │   ├── affiliate/
│   │   └── ai/
│   ├── api/
│   │   ├── ai/chat/route.ts
│   │   ├── webhooks/payments/route.ts
│   │   └── cron/inventory/route.ts
│   ├── layout.tsx
│   └── globals.css
│
├── actions/                # Server Actions par domaine (products.ts, sales.ts, ...)
├── components/
│   ├── ui/                 # composants shadcn/ui
│   ├── dashboard/
│   └── shared/
├── hooks/                  # hooks React (use-products, use-sales, ...)
├── lib/
│   ├── supabase/           # clients supabase (browser, server, middleware)
│   ├── validations/        # schémas Zod
│   └── utils.ts
├── services/                # logique métier pure, appelée par actions/ et api/
│   ├── products.service.ts
│   ├── sales.service.ts
│   ├── inventory.service.ts
│   ├── payments.service.ts
│   └── ai.service.ts
├── database/                 # migrations SQL, dans l'ordre d'exécution
│   ├── 001_schema.sql
│   ├── 002_rls_policies.sql
│   └── 003_triggers_functions.sql
├── types/
│   └── database.types.ts    # types générés/déclarés depuis le schéma Supabase
├── middleware.ts             # rafraîchissement de session + protection des routes
└── README.md
```

## 2. Séparation des responsabilités

- **`app/`** : uniquement de l'UI et de l'orchestration de pages. Aucune logique métier ni requête SQL directe.
- **`actions/`** : Server Actions minces — valident l'input (Zod), appellent un `service`, retournent un résultat typé.
- **`services/`** : toute la logique métier (calculs de stock, profit, inventaire, commissions...). Ce sont ces fonctions qui parlent à Supabase via `lib/supabase/server.ts`. Testables indépendamment de Next.js.
- **`api/`** : routes nécessaires pour des appels externes (webhooks de paiement, cron, chatbot IA) — pas pour le CRUD interne, qui passe par les Server Actions.
- **`lib/supabase/`** : trois clients distincts (browser, server component, route handler) pour respecter les patterns SSR de Supabase.

## 3. Multi-tenant

- Chaque table métier porte une colonne `organization_id`.
- Un utilisateur (`auth.users`) a une ligne `profiles` avec `organization_id` + `role` (`admin` | `staff`).
- Toute donnée est filtrée côté base par Row Level Security — jamais uniquement côté application. Voir `002_rls_policies.sql`.
- Le plan d'abonnement (`free` / `starter` / `pro`) est un attribut de l'**organisation**, pas de l'utilisateur : plusieurs membres d'une même boutique partagent le même plan.

## 4. Hypothèses prises (à valider avec toi)

Le cahier des charges mentionne des rôles "Admin / User / Premium" — j'ai séparé cette notion en deux axes distincts, plus robuste :
- **Rôle d'accès** (`profiles.role`) : `admin` ou `staff`, contrôle ce qu'un membre peut faire dans son organisation.
- **Plan d'abonnement** (`organizations.plan`) : `free` / `starter` / `pro`, contrôle les fonctionnalités disponibles ("Premium" = plan payant, pas un rôle).

J'ai aussi ajouté deux tables non listées explicitement mais nécessaires pour couvrir les fonctionnalités demandées :
- `purchase_items` / `sale_items` détaillées avec quantité, prix, sous-total générés — indispensable pour "plusieurs produits par vente/achat" et le calcul automatique du stock.
- `debt_payments`, `affiliate_clicks`, `affiliate_withdrawals` — nécessaires pour "paiements partiels", "suivi des clics" et "demandes de retrait" mentionnés dans le cahier des charges.

## 5. Prochaines étapes suggérées

1. Exécuter `database/001_schema.sql` → `002_rls_policies.sql` → `003_triggers_functions.sql` dans l'éditeur SQL Supabase (dans cet ordre).
2. Générer les types TypeScript réels depuis ton projet Supabase : `npx supabase gen types typescript --project-id <id> > types/database.types.ts` (le fichier fourni ici est un point de départ écrit à la main).
3. Mettre en place `lib/supabase/client.ts`, `server.ts` et `middleware.ts` (fournis).
4. Passer au module Authentification (inscription/connexion + création automatique du `profiles` + de l'`organization`).
