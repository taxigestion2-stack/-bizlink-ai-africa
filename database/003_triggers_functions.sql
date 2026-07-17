-- =========================================================
-- BizLink AI Africa — 003_triggers_functions.sql
-- Automatisations : updated_at, stock, dettes, création de profil
-- À exécuter après 002_rls_policies.sql
-- =========================================================

-- ---------------------------------------------------------
-- 1. updated_at automatique
-- ---------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_organizations_updated_at before update on organizations
  for each row execute function set_updated_at();
create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();
create trigger trg_debts_updated_at before update on debts
  for each row execute function set_updated_at();
create trigger trg_subscriptions_updated_at before update on subscriptions
  for each row execute function set_updated_at();
create trigger trg_payment_transactions_updated_at before update on payment_transactions
  for each row execute function set_updated_at();

-- ---------------------------------------------------------
-- 2. Stock automatique : un achat augmente le stock
-- ---------------------------------------------------------
create or replace function public.increment_stock_on_purchase()
returns trigger
language plpgsql
as $$
begin
  update products
  set stock_quantity = stock_quantity + new.quantity
  where id = new.product_id;
  return new;
end;
$$;

create trigger trg_purchase_items_increment_stock
  after insert on purchase_items
  for each row execute function increment_stock_on_purchase();

-- Annulation d'un achat (suppression d'une ligne) : on retire le stock ajouté
create or replace function public.decrement_stock_on_purchase_delete()
returns trigger
language plpgsql
as $$
begin
  update products
  set stock_quantity = stock_quantity - old.quantity
  where id = old.product_id;
  return old;
end;
$$;

create trigger trg_purchase_items_delete_stock
  after delete on purchase_items
  for each row execute function decrement_stock_on_purchase_delete();

-- ---------------------------------------------------------
-- 3. Stock automatique : une vente diminue le stock
-- ---------------------------------------------------------
create or replace function public.decrement_stock_on_sale()
returns trigger
language plpgsql
as $$
begin
  update products
  set stock_quantity = stock_quantity - new.quantity
  where id = new.product_id;
  return new;
end;
$$;

create trigger trg_sale_items_decrement_stock
  after insert on sale_items
  for each row execute function decrement_stock_on_sale();

-- Annulation d'une vente (suppression d'une ligne) : on restitue le stock
create or replace function public.increment_stock_on_sale_delete()
returns trigger
language plpgsql
as $$
begin
  update products
  set stock_quantity = stock_quantity + old.quantity
  where id = old.product_id;
  return old;
end;
$$;

create trigger trg_sale_items_delete_stock
  after delete on sale_items
  for each row execute function increment_stock_on_sale_delete();

-- ---------------------------------------------------------
-- 4. Alerte stock faible : notification automatique
-- ---------------------------------------------------------
create or replace function public.notify_low_stock()
returns trigger
language plpgsql
as $$
declare
  v_org_id uuid;
begin
  if new.stock_quantity <= new.min_stock_alert then
    select organization_id into v_org_id from products where id = new.id;
    insert into notifications (organization_id, type, title, message, metadata)
    values (
      v_org_id,
      'stock_low',
      'Stock faible',
      format('Le produit "%s" atteint son seuil minimum (%s restant(s)).', new.name, new.stock_quantity),
      jsonb_build_object('product_id', new.id)
    );
  end if;
  return new;
end;
$$;

create trigger trg_products_low_stock
  after update of stock_quantity on products
  for each row execute function notify_low_stock();

-- ---------------------------------------------------------
-- 5. Paiement partiel d'une dette : mise à jour du solde restant
-- ---------------------------------------------------------
create or replace function public.apply_debt_payment()
returns trigger
language plpgsql
as $$
begin
  update debts
  set
    remaining_amount = greatest(remaining_amount - new.amount, 0),
    status = case
      when remaining_amount - new.amount <= 0 then 'paid'::debt_status
      else 'partial'::debt_status
    end
  where id = new.debt_id;
  return new;
end;
$$;

create trigger trg_debt_payments_apply
  after insert on debt_payments
  for each row execute function apply_debt_payment();

-- ---------------------------------------------------------
-- 6. Création automatique du profil + organisation à l'inscription
-- Déclenché sur auth.users (géré par Supabase)
-- ---------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_org_name text;
begin
  v_org_name := coalesce(new.raw_user_meta_data->>'organization_name', 'Ma boutique');

  insert into organizations (name, slug, plan)
  values (
    v_org_name,
    lower(regexp_replace(v_org_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 8),
    'free'
  )
  returning id into v_org_id;

  insert into profiles (id, organization_id, full_name, email, role)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    'admin'
  );

  update organizations set owner_id = new.id where id = v_org_id;

  insert into subscriptions (organization_id, plan, status, current_period_start)
  values (v_org_id, 'free', 'active', now());

  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------
-- NOTE
-- ---------------------------------------------------------
-- Les triggers d'incrément/décrément de stock ne gèrent pas les cas
-- de UPDATE de quantité sur une ligne existante (seulement insert/delete).
-- Dans les Server Actions, préférer toujours "supprimer puis recréer" la
-- ligne plutôt que de faire un UPDATE de quantity, pour rester cohérent
-- avec ces triggers.
