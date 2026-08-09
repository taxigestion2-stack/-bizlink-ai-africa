# Guide de déploiement — Vercel

## 1. Prérequis

- Un projet Supabase en production avec les migrations `database/001` à `006` exécutées
- Un compte Vercel connecté à votre dépôt Git (GitHub/GitLab/Bitbucket)

## 2. Importer le projet

1. Sur [vercel.com](https://vercel.com), **Add New → Project**
2. Sélectionner le dépôt `bizlink-ai-africa`
3. Framework Preset : Next.js (détecté automatiquement)

## 3. Variables d'environnement

Dans **Project Settings → Environment Variables**, ajouter (voir `.env.example`) :

| Variable | Environnement |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview (⚠️ jamais côté client) |
| `NEXT_PUBLIC_SITE_URL` | l'URL de déploiement finale, ex: `https://bizlink-ai-africa.vercel.app` |
| `OPENAI_API_KEY` | Production, Preview |
| `OPENAI_MODEL` | Production, Preview |
| `CRON_SECRET` | Production |
| `MANUAL_PAYMENT_WEBHOOK_SECRET` | Production, Preview |

## 4. Déployer

```bash
vercel --prod
```

ou simplement pousser sur la branche connectée à Vercel (déploiement automatique).

## 5. Configurer le cron d'inventaire

Le fichier `vercel.json` déclare déjà le cron :

```json
{
  "crons": [{ "path": "/api/cron/inventory", "schedule": "0 2 1 * *" }]
}
```

Vercel appelle automatiquement cette route le 1er de chaque mois à 2h du matin (UTC).
Vérifier dans **Project Settings → Cron Jobs** que le job apparaît bien après le premier
déploiement.

⚠️ Vercel Cron n'envoie pas nativement l'en-tête `Authorization: Bearer <CRON_SECRET>`.
Deux options :
- Utiliser [Vercel Cron avec protection par déploiement](https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs) (recommandé), ou
- Adapter `app/api/cron/inventory/route.ts` pour vérifier l'en-tête que Vercel envoie
  réellement dans votre configuration (`x-vercel-cron-signature` selon la doc Vercel à jour).

## 6. Configurer les webhooks de paiement

Pour le fournisseur de paiement réel que vous connectez (voir `lib/payments/providers/`),
configurer dans son dashboard l'URL de webhook :

```
https://<votre-domaine>/api/webhooks/payments?provider=<clé_du_fournisseur>
```

Exemple avec le fournisseur de référence :
```
https://<votre-domaine>/api/webhooks/payments?provider=manual
```

## 7. Configurer Google OAuth en production

Dans Supabase Dashboard → Authentication → URL Configuration, ajouter votre domaine
Vercel à **Site URL** et **Redirect URLs** :
```
https://<votre-domaine>/auth/callback
```

## 8. Domaine personnalisé (optionnel)

**Project Settings → Domains** → ajouter votre domaine, puis mettre à jour
`NEXT_PUBLIC_SITE_URL` et les URLs de redirection Supabase en conséquence.

## 9. Vérifications post-déploiement

- [ ] Inscription + confirmation e-mail fonctionnent
- [ ] Connexion Google fonctionne
- [ ] Une vente diminue bien le stock (vérifier dans Supabase Table Editor)
- [ ] Le chatbot IA répond (vérifier que `OPENAI_API_KEY` est valide)
- [ ] `/api/cron/inventory` répond `200` en l'appelant manuellement avec le bon secret
- [ ] Le webhook de paiement met bien à jour `subscriptions.status` en `active`
