-- =========================================================
-- BizLink AI Africa — 010_payment_proof.sql
-- Paiement par preuve (Mobile Money / virement) + vérification admin
-- À exécuter après 009_savings.sql
-- =========================================================

-- ---------------------------------------------------------
-- Colonnes supplémentaires sur payment_transactions
-- ---------------------------------------------------------
alter table payment_transactions
  add column if not exists payment_method text,              -- 'mobile_money' | 'bank_transfer'
  add column if not exists proof_transaction_id text,         -- identifiant donné par l'opérateur/la banque
  add column if not exists proof_screenshot_path text,        -- chemin dans le bucket de stockage (privé)
  add column if not exists reference_number text unique,      -- ex: BZ-4F9A2C1D, montré au commerçant
  add column if not exists reviewed_by uuid references profiles(id) on delete set null,
  add column if not exists review_notes text,
  add column if not exists reviewed_at timestamptz;

create index if not exists idx_payment_transactions_reference on payment_transactions(reference_number);

-- ---------------------------------------------------------
-- PLATFORM_ADMINS : les personnes qui opèrent BizLink AI Africa elles-mêmes
-- (pas les admins d'une boutique cliente) — seules elles peuvent vérifier
-- les preuves de paiement de TOUTES les organisations.
-- ---------------------------------------------------------
create table if not exists platform_admins (
  id uuid primary key references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table platform_admins enable row level security;

create policy "platform_admins_select_self" on platform_admins for select
  using (id = auth.uid());

-- ---------------------------------------------------------
-- Fonction utilitaire : l'utilisateur connecté est-il un admin plateforme ?
-- ---------------------------------------------------------
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from platform_admins where id = auth.uid());
$$;

-- Un admin plateforme peut lire TOUTES les transactions (toutes organisations)
create policy "payment_transactions_select_platform_admin" on payment_transactions for select
  using (is_platform_admin());

-- ---------------------------------------------------------
-- STOCKAGE : bucket privé pour les captures d'écran de preuve de paiement
-- Convention de chemin : {organization_id}/{fichier} — permet de restreindre
-- l'accès par dossier via Row Level Security sur storage.objects.
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

create policy "payment_proofs_insert_own_org"
on storage.objects for insert
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = current_organization_id()::text
);

create policy "payment_proofs_select_own_org_or_platform_admin"
on storage.objects for select
using (
  bucket_id = 'payment-proofs'
  and (
    (storage.foldername(name))[1] = current_organization_id()::text
    or is_platform_admin()
  )
);

-- ---------------------------------------------------------
-- IMPORTANT — À FAIRE MANUELLEMENT APRÈS CETTE MIGRATION :
-- Ajoute-toi comme admin plateforme (remplace l'e-mail par le tien) :
--
-- insert into platform_admins (id)
-- select id from profiles where email = 'ton.email@exemple.com';
-- ---------------------------------------------------------
