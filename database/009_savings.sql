-- =========================================================
-- BizLink AI Africa — 009_savings.sql
-- Module Épargne : dépôts/retraits, solde calculé automatiquement
-- À exécuter après 008_stock_counts.sql
-- =========================================================

create type savings_transaction_type as enum ('deposit', 'withdrawal');

create table savings_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  type savings_transaction_type not null,
  amount numeric(14,2) not null check (amount > 0),
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_savings_transactions_organization on savings_transactions(organization_id, created_at);

alter table savings_transactions enable row level security;

-- Lecture : tous les membres de l'organisation
create policy "savings_transactions_select_same_org" on savings_transactions for select
  using (organization_id = current_organization_id());

-- Écriture : ajout uniquement, aucune modification/suppression possible
-- (comme un vrai livre de comptes : une erreur se corrige par une nouvelle
-- écriture inverse, pas en réécrivant l'historique).
create policy "savings_transactions_insert_same_org" on savings_transactions for insert
  with check (organization_id = current_organization_id());

-- ---------------------------------------------------------
-- RPC : empêche un retrait de rendre le solde négatif, en le vérifiant
-- atomiquement côté serveur (le calcul du solde ne doit jamais se faire
-- uniquement côté client, qui pourrait être désynchronisé).
-- ---------------------------------------------------------
create or replace function public.create_savings_transaction(
  p_organization_id uuid,
  p_type savings_transaction_type,
  p_amount numeric,
  p_notes text default null
)
returns savings_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric(14,2);
  v_transaction savings_transactions;
begin
  if current_organization_id() is distinct from p_organization_id then
    raise exception 'Accès refusé : organisation invalide';
  end if;

  if p_amount <= 0 then
    raise exception 'Le montant doit être positif';
  end if;

  select coalesce(sum(case when type = 'deposit' then amount else -amount end), 0)
  into v_balance
  from savings_transactions
  where organization_id = p_organization_id;

  if p_type = 'withdrawal' and p_amount > v_balance then
    raise exception 'Solde insuffisant (disponible : %)', v_balance;
  end if;

  insert into savings_transactions (organization_id, type, amount, notes, created_by)
  values (p_organization_id, p_type, p_amount, p_notes, auth.uid())
  returning * into v_transaction;

  insert into activity_logs (organization_id, user_id, action, entity_type, entity_id)
  values (p_organization_id, auth.uid(), 'create', 'savings_transaction', v_transaction.id);

  return v_transaction;
end;
$$;
