-- =========================================================
-- BizLink AI Africa — 001_schema.sql
-- Schéma complet : tables, contraintes, index
-- À exécuter en premier dans l'éditeur SQL Supabase
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------
create type user_role as enum ('admin', 'staff');
create type subscription_plan as enum ('free', 'starter', 'pro');
create type subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'expired');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type debt_status as enum ('open', 'partial', 'paid');
create type sale_payment_status as enum ('paid', 'partial', 'unpaid');
create type notification_type as enum (
  'stock_low', 'subscription', 'sale', 'debt', 'payment', 'commission', 'referral_reward', 'system'
);
create type affiliate_status as enum ('pending', 'approved', 'suspended');
create type commission_status as enum ('pending', 'validated', 'paid', 'rejected');
create type referral_status as enum ('pending', 'converted', 'rewarded');
create type withdrawal_status as enum ('pending', 'processing', 'paid', 'rejected');

-- ---------------------------------------------------------
-- ORGANIZATIONS & PROFILES
-- ---------------------------------------------------------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  owner_id uuid, -- FK ajoutée après création de profiles
  plan subscription_plan not null default 'free',
  currency text not null default 'USD',
  phone text,
  address text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  full_name text,
  email text not null,
  phone text,
  avatar_url text,
  role user_role not null default 'admin',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table organizations
  add constraint fk_organizations_owner foreign key (owner_id) references profiles(id) on delete restrict;

-- ---------------------------------------------------------
-- CATALOGUE
-- ---------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz not null default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  sku text,
  barcode text,
  description text,
  unit text not null default 'unité',
  purchase_price numeric(14,2) not null default 0 check (purchase_price >= 0),
  sale_price numeric(14,2) not null default 0 check (sale_price >= 0),
  stock_quantity numeric(14,2) not null default 0,
  min_stock_alert numeric(14,2) not null default 5,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, sku)
);

-- ---------------------------------------------------------
-- ACHATS
-- ---------------------------------------------------------
create table purchases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  supplier_id uuid references suppliers(id) on delete set null,
  purchase_date date not null default current_date,
  total_amount numeric(14,2) not null default 0,
  status text not null default 'received',
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  quantity numeric(14,2) not null check (quantity > 0),
  unit_cost numeric(14,2) not null check (unit_cost >= 0),
  subtotal numeric(14,2) generated always as (quantity * unit_cost) stored
);

-- ---------------------------------------------------------
-- VENTES
-- ---------------------------------------------------------
create table sales (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  sale_date date not null default current_date,
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  profit numeric(14,2) not null default 0,
  payment_status sale_payment_status not null default 'paid',
  payment_method text,
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  quantity numeric(14,2) not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  unit_cost numeric(14,2) not null default 0,
  subtotal numeric(14,2) generated always as (quantity * unit_price) stored,
  profit numeric(14,2) generated always as (quantity * (unit_price - unit_cost)) stored
);

-- ---------------------------------------------------------
-- DÉPENSES
-- ---------------------------------------------------------
create table expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  category text not null,
  description text,
  amount numeric(14,2) not null check (amount >= 0),
  expense_date date not null default current_date,
  receipt_url text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- DETTES CLIENTS
-- ---------------------------------------------------------
create table debts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  sale_id uuid references sales(id) on delete set null,
  original_amount numeric(14,2) not null check (original_amount >= 0),
  remaining_amount numeric(14,2) not null check (remaining_amount >= 0),
  status debt_status not null default 'open',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table debt_payments (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references debts(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  payment_date date not null default current_date,
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- INVENTAIRE AUTOMATIQUE
-- ---------------------------------------------------------
create table inventory_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  opening_stock_value numeric(14,2) not null default 0,
  purchases_value numeric(14,2) not null default 0,
  sales_value numeric(14,2) not null default 0,
  closing_stock_value numeric(14,2) not null default 0,
  losses numeric(14,2) not null default 0,
  discrepancies numeric(14,2) not null default 0,
  generated_at timestamptz not null default now(),
  unique (organization_id, period_start, period_end)
);

-- ---------------------------------------------------------
-- CHATBOT IA
-- ---------------------------------------------------------
create table chat_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  role text not null check (role in ('user', 'assistant')),
  message text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- ABONNEMENTS & PAIEMENTS (architecture "Paiement Pro" agnostique du fournisseur)
-- ---------------------------------------------------------
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  plan subscription_plan not null default 'free',
  status subscription_status not null default 'trialing',
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table payment_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  subscription_id uuid references subscriptions(id) on delete set null,
  amount numeric(14,2) not null check (amount >= 0),
  currency text not null default 'USD',
  status payment_status not null default 'pending',
  provider text not null, -- ex: 'mtn_momo', 'orange_money', 'stripe' — jamais codé en dur dans la logique
  provider_transaction_id text,
  invoice_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- PARRAINAGE
-- ---------------------------------------------------------
create table referral_codes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  code text unique not null,
  created_at timestamptz not null default now()
);

create table referrals (
  id uuid primary key default gen_random_uuid(),
  referral_code_id uuid not null references referral_codes(id) on delete cascade,
  referrer_organization_id uuid not null references organizations(id) on delete cascade,
  referred_organization_id uuid references organizations(id) on delete set null,
  status referral_status not null default 'pending',
  reward_granted boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- AFFILIATION
-- ---------------------------------------------------------
create table affiliate_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  affiliate_code text unique not null,
  status affiliate_status not null default 'pending',
  total_clicks integer not null default 0,
  total_conversions integer not null default 0,
  total_earnings numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id)
);

create table affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  affiliate_account_id uuid not null references affiliate_accounts(id) on delete cascade,
  ip_address text,
  referrer_url text,
  created_at timestamptz not null default now()
);

create table affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_account_id uuid not null references affiliate_accounts(id) on delete cascade,
  source_organization_id uuid references organizations(id) on delete set null,
  amount numeric(14,2) not null check (amount >= 0),
  status commission_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table affiliate_withdrawals (
  id uuid primary key default gen_random_uuid(),
  affiliate_account_id uuid not null references affiliate_accounts(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  status withdrawal_status not null default 'pending',
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);

-- ---------------------------------------------------------
-- NOTIFICATIONS & AUDIT
-- ---------------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  type notification_type not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- INDEX
-- ---------------------------------------------------------
create index idx_profiles_organization on profiles(organization_id);
create index idx_products_organization on products(organization_id);
create index idx_products_category on products(category_id);
create index idx_purchases_organization on purchases(organization_id, purchase_date);
create index idx_purchase_items_purchase on purchase_items(purchase_id);
create index idx_purchase_items_product on purchase_items(product_id);
create index idx_sales_organization on sales(organization_id, sale_date);
create index idx_sale_items_sale on sale_items(sale_id);
create index idx_sale_items_product on sale_items(product_id);
create index idx_expenses_organization on expenses(organization_id, expense_date);
create index idx_debts_organization on debts(organization_id);
create index idx_debts_customer on debts(customer_id);
create index idx_debt_payments_debt on debt_payments(debt_id);
create index idx_inventory_reports_org on inventory_reports(organization_id);
create index idx_chat_logs_org on chat_logs(organization_id, created_at);
create index idx_subscriptions_org on subscriptions(organization_id);
create index idx_payment_transactions_org on payment_transactions(organization_id);
create index idx_referral_codes_org on referral_codes(organization_id);
create index idx_referrals_referrer on referrals(referrer_organization_id);
create index idx_affiliate_accounts_user on affiliate_accounts(user_id);
create index idx_affiliate_commissions_account on affiliate_commissions(affiliate_account_id);
create index idx_notifications_org_user on notifications(organization_id, user_id, is_read);
create index idx_activity_logs_org on activity_logs(organization_id, created_at);
