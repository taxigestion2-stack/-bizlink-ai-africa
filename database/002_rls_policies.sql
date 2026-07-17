-- =========================================================
-- BizLink AI Africa — 002_rls_policies.sql
-- Isolation multi-tenant via Row Level Security
-- À exécuter après 001_schema.sql
-- =========================================================

-- ---------------------------------------------------------
-- Fonction utilitaire : organisation de l'utilisateur connecté
-- SECURITY DEFINER pour éviter la récursion RLS sur `profiles`
-- ---------------------------------------------------------
create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------
-- Activation RLS sur toutes les tables
-- ---------------------------------------------------------
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table categories enable row level security;
alter table suppliers enable row level security;
alter table customers enable row level security;
alter table products enable row level security;
alter table purchases enable row level security;
alter table purchase_items enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table expenses enable row level security;
alter table debts enable row level security;
alter table debt_payments enable row level security;
alter table inventory_reports enable row level security;
alter table chat_logs enable row level security;
alter table subscriptions enable row level security;
alter table payment_transactions enable row level security;
alter table referral_codes enable row level security;
alter table referrals enable row level security;
alter table affiliate_accounts enable row level security;
alter table affiliate_clicks enable row level security;
alter table affiliate_commissions enable row level security;
alter table affiliate_withdrawals enable row level security;
alter table notifications enable row level security;
alter table activity_logs enable row level security;

-- ---------------------------------------------------------
-- ORGANIZATIONS
-- ---------------------------------------------------------
create policy "org_select_own" on organizations for select
  using (id = current_organization_id());

create policy "org_update_own_admin" on organizations for update
  using (id = current_organization_id() and current_role() = 'admin');

-- L'insertion se fait via une fonction sécurisée côté serveur (signup flow),
-- pas directement par le client. Voir 003_triggers_functions.sql.

-- ---------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------
create policy "profiles_select_same_org" on profiles for select
  using (organization_id = current_organization_id() or id = auth.uid());

create policy "profiles_update_self" on profiles for update
  using (id = auth.uid());

-- ---------------------------------------------------------
-- Macro générique : tables simples scoped par organization_id
-- (categories, suppliers, customers, products, purchases, sales,
--  expenses, debts, inventory_reports, chat_logs, subscriptions,
--  payment_transactions, referral_codes, notifications, activity_logs)
-- Chaque bloc ci-dessous suit le même schéma : select/insert/update/delete
-- limités à l'organisation de l'utilisateur connecté.
-- ---------------------------------------------------------

-- CATEGORIES
create policy "categories_all_same_org" on categories for all
  using (organization_id = current_organization_id())
  with check (organization_id = current_organization_id());

-- SUPPLIERS
create policy "suppliers_all_same_org" on suppliers for all
  using (organization_id = current_organization_id())
  with check (organization_id = current_organization_id());

-- CUSTOMERS
create policy "customers_all_same_org" on customers for all
  using (organization_id = current_organization_id())
  with check (organization_id = current_organization_id());

-- PRODUCTS
create policy "products_all_same_org" on products for all
  using (organization_id = current_organization_id())
  with check (organization_id = current_organization_id());

-- PURCHASES
create policy "purchases_all_same_org" on purchases for all
  using (organization_id = current_organization_id())
  with check (organization_id = current_organization_id());

-- PURCHASE_ITEMS (scoped via la commande parente)
create policy "purchase_items_same_org" on purchase_items for all
  using (
    purchase_id in (select id from purchases where organization_id = current_organization_id())
  )
  with check (
    purchase_id in (select id from purchases where organization_id = current_organization_id())
  );

-- SALES
create policy "sales_all_same_org" on sales for all
  using (organization_id = current_organization_id())
  with check (organization_id = current_organization_id());

-- SALE_ITEMS (scoped via la vente parente)
create policy "sale_items_same_org" on sale_items for all
  using (
    sale_id in (select id from sales where organization_id = current_organization_id())
  )
  with check (
    sale_id in (select id from sales where organization_id = current_organization_id())
  );

-- EXPENSES
create policy "expenses_all_same_org" on expenses for all
  using (organization_id = current_organization_id())
  with check (organization_id = current_organization_id());

-- DEBTS
create policy "debts_all_same_org" on debts for all
  using (organization_id = current_organization_id())
  with check (organization_id = current_organization_id());

-- DEBT_PAYMENTS (scoped via la dette parente)
create policy "debt_payments_same_org" on debt_payments for all
  using (
    debt_id in (select id from debts where organization_id = current_organization_id())
  )
  with check (
    debt_id in (select id from debts where organization_id = current_organization_id())
  );

-- INVENTORY_REPORTS (lecture seule côté client — générés par cron/service role)
create policy "inventory_reports_select_same_org" on inventory_reports for select
  using (organization_id = current_organization_id());

-- CHAT_LOGS
create policy "chat_logs_all_same_org" on chat_logs for all
  using (organization_id = current_organization_id())
  with check (organization_id = current_organization_id());

-- SUBSCRIPTIONS (lecture pour l'org ; écriture réservée au service role / webhooks)
create policy "subscriptions_select_same_org" on subscriptions for select
  using (organization_id = current_organization_id());

-- PAYMENT_TRANSACTIONS (lecture pour l'org ; écriture réservée au service role / webhooks)
create policy "payment_transactions_select_same_org" on payment_transactions for select
  using (organization_id = current_organization_id());

-- REFERRAL_CODES
create policy "referral_codes_all_same_org" on referral_codes for all
  using (organization_id = current_organization_id())
  with check (organization_id = current_organization_id());

-- REFERRALS (visible si on est le parrain)
create policy "referrals_select_as_referrer" on referrals for select
  using (referrer_organization_id = current_organization_id());

-- AFFILIATE_ACCOUNTS (scoped par utilisateur, pas par organisation)
create policy "affiliate_accounts_own" on affiliate_accounts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- AFFILIATE_CLICKS (scoped via le compte affilié)
create policy "affiliate_clicks_own" on affiliate_clicks for select
  using (
    affiliate_account_id in (select id from affiliate_accounts where user_id = auth.uid())
  );

-- AFFILIATE_COMMISSIONS (scoped via le compte affilié)
create policy "affiliate_commissions_own" on affiliate_commissions for select
  using (
    affiliate_account_id in (select id from affiliate_accounts where user_id = auth.uid())
  );

-- AFFILIATE_WITHDRAWALS (scoped via le compte affilié)
create policy "affiliate_withdrawals_own" on affiliate_withdrawals for all
  using (
    affiliate_account_id in (select id from affiliate_accounts where user_id = auth.uid())
  )
  with check (
    affiliate_account_id in (select id from affiliate_accounts where user_id = auth.uid())
  );

-- NOTIFICATIONS (visibles par l'utilisateur destinataire dans son organisation)
create policy "notifications_select_own" on notifications for select
  using (organization_id = current_organization_id() and (user_id = auth.uid() or user_id is null));

create policy "notifications_update_own" on notifications for update
  using (organization_id = current_organization_id() and (user_id = auth.uid() or user_id is null));

-- ACTIVITY_LOGS (lecture seule pour l'organisation, écrit par les services)
create policy "activity_logs_select_same_org" on activity_logs for select
  using (organization_id = current_organization_id());

-- ---------------------------------------------------------
-- NOTE IMPORTANTE
-- ---------------------------------------------------------
-- Les tables `subscriptions`, `payment_transactions` et `inventory_reports`
-- n'ont volontairement PAS de policy d'écriture pour les utilisateurs normaux :
-- ces écritures doivent passer par des Route Handlers utilisant la
-- service_role key de Supabase (jamais exposée au client), typiquement
-- depuis les webhooks de paiement et le cron d'inventaire.
