# Sécurité — BizLink AI Africa

Récapitulatif des mesures de sécurité implémentées dans les livrables précédents.

## Authentification & sessions
- Supabase Auth (JWT), cookies HttpOnly gérés par `@supabase/ssr`.
- `middleware.ts` rafraîchit la session à chaque requête et protège toutes les routes non publiques.
- Rate limiting anti brute-force sur la connexion : 5 tentatives / 5 min / e-mail (`lib/rate-limit.ts`).
- Les erreurs d'authentification sont traduites en messages génériques (pas d'énumération de comptes sur "mot de passe oublié").

## Isolation des données (multi-tenant)
- Row Level Security activée sur **toutes** les tables métier (`database/002_rls_policies.sql`).
- Fonctions `current_organization_id()` / `current_role()` en `SECURITY DEFINER` pour éviter la récursion RLS.
- Aucune requête Supabase n'est faite directement depuis `app/` : tout passe par `services/`, qui utilisent le client scoré par session (jamais le service role, sauf besoin explicite documenté).

## Validation des entrées
- Tous les formulaires et Server Actions valident les données via Zod (`lib/validations/`) avant tout accès base de données.
- Les routes API (`/api/ai/chat`, webhooks) valident également leur payload côté serveur.

## Protection des opérations sensibles
- `payment_transactions`, `subscriptions`, `inventory_reports` : aucune policy RLS d'écriture pour les utilisateurs → modifiables uniquement via `service_role` dans des Route Handlers de confiance (webhooks, cron, actions admin explicitement vérifiées).
- Les opérations multi-tables (achat, vente) passent par des fonctions RPC PL/pgSQL atomiques qui re-vérifient `current_organization_id()` en première ligne — impossible d'écrire dans une autre organisation même en appelant le RPC directement.
- Le rôle `admin` est requis pour les actions sensibles (génération manuelle d'inventaire, gestion de l'abonnement).

## Webhooks
- Chaque fournisseur de paiement implémente sa propre vérification de signature (`PaymentProvider.verifyWebhookSignature`), jamais de confiance implicite dans le payload reçu.
- Le webhook cron (`/api/cron/inventory`) exige un secret partagé (`CRON_SECRET`) en en-tête `Authorization`.

## Protection HTTP
- En-têtes de sécurité globaux dans `next.config.js` : `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- CSRF : les Server Actions Next.js sont protégées nativement (vérification d'origine) ; aucun formulaire ne soumet en `GET` vers une route qui mute des données.
- XSS : React échappe par défaut tout contenu dynamique ; aucun usage de `dangerouslySetInnerHTML` dans le code livré.
- SQL Injection : aucune requête SQL brute concaténée ; tout passe par le client Supabase (requêtes paramétrées) ou des fonctions PL/pgSQL avec paramètres typés.

## Audit
- `activity_logs` trace les actions sensibles (création d'achat, de vente...).
- `notifications` informe l'utilisateur des événements importants (paiement, stock, commission, parrainage).

## Limites connues (MVP)
- Le rate limiting est en mémoire locale (`lib/rate-limit.ts`) : suffisant pour une seule instance, à remplacer par un store partagé (Upstash Redis) avant une mise à l'échelle horizontale.
- Aucune 2FA n'est implémentée (peut être ajoutée via Supabase Auth MFA sans changement d'architecture).
