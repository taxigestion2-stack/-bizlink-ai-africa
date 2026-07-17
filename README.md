# BizLink AI Africa

ERP SaaS léger pour petits commerces africains (boutiques, pharmacies, restaurants,
vendeurs WhatsApp/Facebook/TikTok, PME locales) : stock, achats, ventes, dépenses,
dettes clients, inventaire automatique, assistant IA, abonnements, parrainage et
affiliation.

## Stack technique

- **Frontend** : Next.js 15 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, React Hook Form, Zod, Recharts
- **Backend** : Server Actions, Route Handlers, Supabase (PostgreSQL, Auth, Row Level Security)
- **IA** : OpenAI API (Chat Completions)
- **Déploiement cible** : Vercel

## Structure du projet

Voir [`ARCHITECTURE.md`](./ARCHITECTURE.md) pour le détail de l'organisation des dossiers
et des choix de conception (multi-tenant, séparation UI/actions/services).

## Installation locale

### 1. Prérequis

- Node.js 20+
- Un projet Supabase (gratuit sur [supabase.com](https://supabase.com))
- Une clé API OpenAI

### 2. Cloner et installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Remplir `.env.local` avec :
- `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` : Project Settings → API, dans votre projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY` : même page (⚠️ à ne jamais exposer publiquement)
- `NEXT_PUBLIC_SITE_URL` : `http://localhost:3000` en local
- `OPENAI_API_KEY` : platform.openai.com
- `CRON_SECRET` : une chaîne aléatoire de votre choix
- `MANUAL_PAYMENT_WEBHOOK_SECRET` : une chaîne aléatoire de votre choix (fournisseur de paiement de référence)

### 4. Initialiser la base de données

Dans l'éditeur SQL de votre projet Supabase (Dashboard → SQL Editor), exécuter
les fichiers de `database/` **dans l'ordre numérique** :

```
001_schema.sql
002_rls_policies.sql
003_triggers_functions.sql
004_rpc_functions.sql
005_referrals_signup.sql
006_affiliate_attribution.sql
```

### 5. Activer l'authentification Google (optionnel)

Dashboard Supabase → Authentication → Providers → Google → renseigner Client ID/Secret,
puis ajouter l'URL de callback `https://<votre-projet>.supabase.co/auth/v1/callback`
dans la console Google Cloud.

### 6. Générer les types TypeScript réels

```bash
npx supabase gen types typescript --project-id <votre-project-id> > types/database.types.ts
```

(Le fichier fourni dans ce livrable est écrit à la main comme point de départ.)

### 7. Lancer le serveur de développement

```bash
npm run dev
```

L'application est disponible sur `http://localhost:3000`.

## Sécurité

Voir [`SECURITY.md`](./SECURITY.md) pour le détail des mesures de sécurité implémentées
(RLS, validation, rate limiting, webhooks, en-têtes HTTP).

## Déploiement

Voir [`DEPLOYMENT.md`](./DEPLOYMENT.md) pour le guide de déploiement sur Vercel,
y compris la configuration du cron d'inventaire mensuel et des webhooks de paiement.

## Modules livrés

| Module | Statut |
|---|---|
| Architecture & fondations | ✅ |
| Authentification (email/mdp, Google OAuth) | ✅ |
| Base de données & RLS | ✅ |
| Produits / Stock | ✅ |
| Achats | ✅ |
| Ventes | ✅ |
| Dépenses | ✅ |
| Dettes clients | ✅ |
| Inventaire automatique | ✅ |
| Dashboard | ✅ |
| Chatbot Business AI | ✅ |
| Paiement Pro (architecture générique) | ✅ |
| Abonnements | ✅ |
| Parrainage | ✅ |
| Affiliation | ✅ |
| Notifications | ✅ |
| Sécurité | ✅ |

## Limites connues du MVP (à faire évoluer)

- Un seul fournisseur de paiement de référence est fourni (`manual`) ; brancher un vrai
  fournisseur (Mobile Money, Stripe...) se fait dans `lib/payments/providers/` sans toucher
  au reste du code.
- Les pertes/écarts d'inventaire (`losses`, `discrepancies`) sont à 0 par défaut : un
  comptage physique manuel n'est pas encore implémenté.
- Le rate limiting est en mémoire locale (mono-instance) — prévoir un store partagé
  (Upstash Redis) avant une montée en charge multi-instances.
- La gestion multi-utilisateurs par organisation (inviter un employé `staff`) n'est pas
  encore exposée dans l'UI, bien que le schéma (`profiles.role`) le permette déjà.
